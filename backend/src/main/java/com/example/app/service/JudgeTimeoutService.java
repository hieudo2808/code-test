package com.example.app.service;

import com.example.app.dto.judge0.Judge0Response;
import com.example.app.entity.Problem;
import com.example.app.entity.SubmissionResult;
import com.example.app.entity.enums.SubmissionStatus;
import com.example.app.entity.enums.Verdict;
import com.example.app.repository.SubmissionResultRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Scheduled service that recovers submissions with lost Judge0 callbacks.
 * Polls Judge0 directly for stale results and updates them.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class JudgeTimeoutService {

    private final SubmissionResultRepository resultRepository;
    private final Judge0Client judge0Client;
    private final JudgeService judgeService;

    /**
     * Runs every 15 seconds. Finds SubmissionResult rows where verdict is still NULL
     * and the parent Submission has been in RUNNING status for > 60 seconds.
     * For each stale result, polls Judge0 directly to recover the result.
     */
    @Scheduled(fixedDelay = 15000)
    @Transactional
    public void recoverStaleResults() {
        OffsetDateTime cutoff = OffsetDateTime.now().minusSeconds(60);
        List<SubmissionResult> staleResults = resultRepository.findStaleResults(SubmissionStatus.RUNNING, cutoff);

        if (staleResults.isEmpty()) return;

        log.info("Found {} stale submission results to recover", staleResults.size());

        Set<UUID> affectedSubmissions = staleResults.stream()
                .map(r -> r.getSubmission().getSubmissionId())
                .collect(Collectors.toSet());

        for (SubmissionResult result : staleResults) {
            try {
                recoverSingleResult(result);
            } catch (Exception e) {
                log.warn("Failed to recover stale result for token: {}", result.getJudge0Token(), e);
                // If we can't reach Judge0 at all, mark as RUNTIME_ERROR to unstick
                result.setVerdict(Verdict.RUNTIME_ERROR);
                result.setScore(0.0);
                result.setErrorMessage("Judge0 callback lost and recovery failed");
                resultRepository.save(result);
            }
        }

        // Re-check aggregation for all affected submissions
        for (UUID submissionId : affectedSubmissions) {
            try {
                judgeService.aggregateIfComplete(submissionId);
            } catch (Exception e) {
                log.error("Failed to aggregate submission: {}", submissionId, e);
            }
        }
    }

    private void recoverSingleResult(SubmissionResult result) {
        String token = result.getJudge0Token();
        if (token == null) {
            // No token means the submit to Judge0 never succeeded — mark as error
            result.setVerdict(Verdict.RUNTIME_ERROR);
            result.setScore(0.0);
            result.setErrorMessage("Judge0 submission token missing");
            resultRepository.save(result);
            return;
        }

        log.debug("Polling Judge0 for stale token: {}", token);
        Judge0Response response = judge0Client.getSubmission(token);

        if (response == null || response.getStatus() == null) {
            // Judge0 has no record — mark as error
            result.setVerdict(Verdict.RUNTIME_ERROR);
            result.setScore(0.0);
            result.setErrorMessage("Judge0 has no record for this submission");
            resultRepository.save(result);
            return;
        }

        int statusId = response.getStatus().getId();

        if (statusId <= 2) {
            // Still in queue or processing at Judge0 — skip for now, will retry next cycle
            log.debug("Token {} still processing at Judge0 (status={}), will retry", token, statusId);
            return;
        }

        // Judge0 has a final result — apply it
        Verdict verdict = judgeService.mapVerdict(statusId);
        if (verdict == null) verdict = Verdict.RUNTIME_ERROR;

        result.setTimeMs(response.getTime() != null ? response.getTime() * 1000 : null);
        result.setMemoryKb(response.getMemory() != null ? response.getMemory().doubleValue() : null);

        // Double-check resource limits even if Judge0 says Accepted
        if (verdict == Verdict.ACCEPTED) {
            Problem problem = result.getSubmission().getProblem();

            if (problem.getMemoryLimit() != null && response.getMemory() != null) {
                int memoryLimitKb = problem.getMemoryLimit() * 1024;
                if (response.getMemory() > memoryLimitKb) {
                    verdict = Verdict.MEMORY_LIMIT;
                    log.warn("Memory limit exceeded (recovered) for token {}: used={}KB, limit={}KB",
                            token, response.getMemory(), memoryLimitKb);
                }
            }

            if (problem.getTimeLimit() != null && response.getTime() != null) {
                if (response.getTime() > problem.getTimeLimit()) {
                    verdict = Verdict.TIME_LIMIT;
                    log.warn("Time limit exceeded (recovered) for token {}: used={}s, limit={}s",
                            token, response.getTime(), problem.getTimeLimit());
                }
            }
        }

        result.setVerdict(verdict);

        if (verdict == Verdict.ACCEPTED) {
            result.setScore(result.getTestcase().getTestcasePoint());
        } else {
            result.setScore(0.0);
            String errorMsg = response.getCompile_output();
            if (errorMsg == null) errorMsg = response.getStderr();
            if (errorMsg == null) errorMsg = response.getMessage();
            if (errorMsg != null && errorMsg.length() > 500) errorMsg = errorMsg.substring(0, 500);
            result.setErrorMessage(errorMsg);
        }

        resultRepository.save(result);
        log.info("Recovered stale result for token: {}, verdict: {}", token, verdict);
    }
}
