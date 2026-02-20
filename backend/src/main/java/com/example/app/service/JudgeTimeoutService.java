package com.example.app.service;

import com.example.app.dto.judge0.Judge0Response;
import com.example.app.entity.Problem;
import com.example.app.entity.SubmissionResult;
import com.example.app.entity.enums.EvaluationType;
import com.example.app.entity.enums.SubmissionStatus;
import com.example.app.entity.enums.Verdict;
import com.example.app.repository.SubmissionResultRepository;
import com.example.app.service.submission.ResultProcessor;
import com.example.app.service.submission.event.JudgeResultReceivedEvent;
import com.example.app.service.submission.event.ScoringRequiredEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class JudgeTimeoutService {

    private final SubmissionResultRepository resultRepository;
    private final Judge0Client judge0Client;
    private final S3StorageService storageService;
    private final ApplicationEventPublisher eventPublisher;

    private static final int HARD_CUTOFF_SECONDS = 300;

    @Scheduled(fixedDelay = 15000)
    @Transactional
    public void recoverStaleResults() {
        OffsetDateTime cutoff = OffsetDateTime.now().minusSeconds(60);
        OffsetDateTime hardCutoff = OffsetDateTime.now().minusSeconds(HARD_CUTOFF_SECONDS);
        List<SubmissionResult> staleResults = resultRepository.findStaleResults(SubmissionStatus.RUNNING, cutoff);

        if (staleResults.isEmpty()) return;

        log.info("Found {} stale submission results to recover", staleResults.size());

        Set<UUID> affectedSubmissions = staleResults.stream()
                .map(r -> r.getSubmission().getSubmissionId())
                .collect(Collectors.toSet());

        // Track results that need HEURISTIC scoring instead of direct aggregation
        List<SubmissionResult> needsScoring = new ArrayList<>();

        for (SubmissionResult result : staleResults) {
            try {
                boolean expired = result.getSubmission().getUpdateAt() != null
                        && result.getSubmission().getUpdateAt().isBefore(hardCutoff);

                if (expired) {
                    log.warn("Token {} exceeded hard cutoff ({}s), marking RUNTIME_ERROR",
                            result.getJudge0Token(), HARD_CUTOFF_SECONDS);
                    result.setVerdict(Verdict.RUNTIME_ERROR);
                    result.setScore(0.0);
                    result.setErrorMessage("Judge0 submission timed out (no result after " + HARD_CUTOFF_SECONDS + "s)");
                    resultRepository.save(result);
                    continue;
                }

                boolean recovered = recoverSingleResult(result);
                if (recovered && needsHeuristicScoring(result)) {
                    needsScoring.add(result);
                }
            } catch (Exception e) {
                log.warn("Failed to recover stale result for token: {}", result.getJudge0Token(), e);
                if (result.getVerdict() == null) {
                    result.setVerdict(Verdict.RUNTIME_ERROR);
                    result.setScore(0.0);
                    result.setErrorMessage("Judge0 callback lost and recovery failed");
                    resultRepository.save(result);
                }
            }
        }

        // Publish scoring events for HEURISTIC+ACCEPTED results
        for (SubmissionResult result : needsScoring) {
            try {
                eventPublisher.publishEvent(new ScoringRequiredEvent(
                        result.getSubmission().getSubmissionId(),
                        result.getSubmissionResultId()));
            } catch (Exception e) {
                log.error("Failed to publish scoring event for result: {}", result.getSubmissionResultId(), e);
            }
        }

        // Publish aggregation events for all affected submissions
        for (UUID submissionId : affectedSubmissions) {
            try {
                eventPublisher.publishEvent(new JudgeResultReceivedEvent(submissionId));
            } catch (Exception e) {
                log.error("Failed to publish aggregation event for submission: {}", submissionId, e);
            }
        }
    }

    /**
     * @return true if the result was recovered (got a final status from Judge0)
     */
    private boolean recoverSingleResult(SubmissionResult result) {
        if (result.getVerdict() != null) return false;

        String token = result.getJudge0Token();
        if (token == null) {
            result.setVerdict(Verdict.RUNTIME_ERROR);
            result.setScore(0.0);
            result.setErrorMessage("Judge0 submission token missing");
            resultRepository.save(result);
            return true;
        }

        log.debug("Polling Judge0 for stale token: {}", token);
        Judge0Response response = judge0Client.getSubmission(token);

        if (response == null || response.getStatus() == null) {
            result.setVerdict(Verdict.RUNTIME_ERROR);
            result.setScore(0.0);
            result.setErrorMessage("Judge0 has no record for this submission");
            resultRepository.save(result);
            return true;
        }

        int statusId = response.getStatus().getId();

        if (statusId <= 2) {
            log.debug("Token {} still processing at Judge0 (status={}), will retry", token, statusId);
            return false;
        }

        // Save user output to S3 (same as ResultProcessor.processCallback)
        try {
            String stdout = response.getStdout() != null ? response.getStdout() : "";
            storageService.saveSubmissionOutput(
                    result.getSubmission().getSubmissionId(),
                    result.getTestcase().getTestcaseId(),
                    stdout);
        } catch (Exception ex) {
            log.warn("Failed to save recovered output to S3 for token={}", token, ex);
        }

        Verdict verdict = ResultProcessor.mapVerdict(statusId);
        if (verdict == null) verdict = Verdict.RUNTIME_ERROR;

        result.setTimeMs(response.getTime() != null ? response.getTime() * 1000 : null);
        result.setMemoryKb(response.getMemory() != null ? response.getMemory().doubleValue() : null);

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
        return true;
    }

    private boolean needsHeuristicScoring(SubmissionResult result) {
        return result.getVerdict() == Verdict.ACCEPTED
                && result.getSubmission().getProblem().getEvaluationType() == EvaluationType.HEURISTIC;
    }
}
