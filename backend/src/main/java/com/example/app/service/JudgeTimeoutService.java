package com.example.app.service;

import com.example.app.dto.judge0.Judge0Response;
import com.example.app.entity.Problem;
import com.example.app.entity.SubmissionResult;
import com.example.app.entity.enums.EvaluationType;
import com.example.app.entity.enums.SubmissionStatus;
import com.example.app.entity.enums.Verdict;
import com.example.app.repository.SubmissionResultRepository;
import com.example.app.service.submission.ResultProcessor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class JudgeTimeoutService {
    private final SubmissionResultRepository resultRepository;
    private final Judge0Client judge0Client;
    private final ResultProcessor resultProcessor;

    private static final int CUTOFF_SECONDS = 15;
    private static final int HARD_CUTOFF_SECONDS = 300;

    @Scheduled(fixedDelay = 5000)
    @Transactional
    public void recoverStaleResults() {
        OffsetDateTime cutoff = OffsetDateTime.now().minusSeconds(CUTOFF_SECONDS);
        OffsetDateTime hardCutoff = OffsetDateTime.now().minusSeconds(HARD_CUTOFF_SECONDS);
        List<SubmissionResult> staleResults = resultRepository.findStaleResults(SubmissionStatus.RUNNING, cutoff);

        if (staleResults.isEmpty()) return;

        for (SubmissionResult result : staleResults) {
            try {
                EvaluationType evalType = result.getSubmission().getProblem().getEvaluationType();

                // HEURISTIC result waiting for scorer: check if scorer is still working or stuck
                if (evalType == EvaluationType.HEURISTIC && result.getTimeMs() != null && result.getVerdict() == null) {
                    OffsetDateTime scorerCutoff = OffsetDateTime.now().minusSeconds(60);
                    boolean scorerStuck = result.getSubmission().getUpdateAt() != null
                            && result.getSubmission().getUpdateAt().isBefore(scorerCutoff);

                    if (!scorerStuck) {
                        log.debug("Skipping HEURISTIC result {} (waiting for scorer, not stale)", result.getSubmissionResultId());
                        continue;
                    }

                    // Scorer seems stuck — re-trigger scoring event
                    log.warn("HEURISTIC result {} has been waiting for scorer >60s, re-triggering scoring",
                            result.getSubmissionResultId());
                    resultProcessor.retriggerScoring(result);
                    continue;
                }

                boolean expired = result.getSubmission().getUpdateAt() != null
                        && result.getSubmission().getUpdateAt().isBefore(hardCutoff);

                if (expired) {
                    log.warn("Token {} exceeded hard cutoff ({}s), marking RUNTIME_ERROR",
                            result.getJudge0Token(), HARD_CUTOFF_SECONDS);
                    resultProcessor.processRecoveredResult(
                            result,
                            Verdict.RUNTIME_ERROR,
                            null,
                            null,
                            "Judge0 submission timed out (no result after \" + HARD_CUTOFF_SECONDS + \"s)",
                            ""
                    );
                    continue;
                }
                recoverSingleResult(result);
            } catch (Exception e) {
                log.warn("Failed to recover stale result for token: {}", result.getJudge0Token(), e);
                if (result.getVerdict() == null) {
                    resultProcessor.processRecoveredResult(
                            result,
                            Verdict.RUNTIME_ERROR,
                            null,
                            null,
                            "Judge0 callback lost and recovery failed",
                            ""
                    );
                }
            }
        }
    }

    /**
     *
     */
    private void recoverSingleResult(SubmissionResult result) {
        if (result.getVerdict() != null) return;

        String token = result.getJudge0Token();
        if (token == null) {
            resultProcessor.processRecoveredResult(
                    result,
                    Verdict.RUNTIME_ERROR,
                    null,
                    null,
                    "Judge0 submission token missing",
                    ""
            );
            return;
        }

        log.debug("Polling Judge0 for stale token: {}", token);
        Judge0Response response = judge0Client.getSubmission(token);

        if (response == null || response.getStatus() == null) {
            resultProcessor.processRecoveredResult(
                    result,
                    Verdict.RUNTIME_ERROR,
                    null,
                    null,
                    "Judge0 has no record for this submission",
                    ""
            );
            return;
        }

        int statusId = response.getStatus().getId();

        if (statusId <= 2) {
            log.debug("Token {} still processing at Judge0 (status={}), will retry", token, statusId);
            return;
        }

        Verdict verdict = ResultProcessor.mapVerdict(statusId);
        if (verdict == null) verdict = Verdict.RUNTIME_ERROR;

        Double timeMs = response.getTime() != null ? response.getTime() * 1000 : null;
        Double memoryKb = response.getMemory() != null ? response.getMemory().doubleValue() : null;

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

        String errorMsg = null;
        if (verdict != Verdict.ACCEPTED) {
            errorMsg = response.getCompile_output();
            if (errorMsg == null) errorMsg = response.getStderr();
            if (errorMsg == null) errorMsg = response.getMessage();
        }

        resultProcessor.processRecoveredResult(
                result,
                verdict,
                timeMs,
                memoryKb,
                errorMsg,
                response.getStdout()
        );
    }
}
