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
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class JudgeTimeoutService {
    private final SubmissionResultRepository resultRepository;
    private final Judge0Client judge0Client;
    private final ResultProcessor resultProcessor;

    private static final int HARD_CUTOFF_SECONDS = 300;
    private static final int SCORER_TIMEOUT_SECONDS = 60;

    @Scheduled(fixedDelay = 5000)
    public void recoverStaleResults() {
        OffsetDateTime waitCutoff = OffsetDateTime.now().minusSeconds(SCORER_TIMEOUT_SECONDS);
        Pageable limit = PageRequest.of(0, 100);
        List<SubmissionResult> staleResults = resultRepository.findStaleResultsByDispatchTime(waitCutoff, limit);

        if (staleResults.isEmpty()) return;

        List<SubmissionResult> toPoll = new ArrayList<>();

        for (SubmissionResult result : staleResults) {
            try {
                EvaluationType evalType = result.getSubmission().getProblem().getEvaluationType();

                // HEURISTIC result waiting for scorer: check if scorer is still working or stuck
                if (evalType == EvaluationType.HEURISTIC && result.getTimeMs() != null && result.getVerdict() == null) {
                    OffsetDateTime scorerCutoff = OffsetDateTime.now().minusSeconds(SCORER_TIMEOUT_SECONDS);
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

                OffsetDateTime hardCutoff = OffsetDateTime.now().minusSeconds(HARD_CUTOFF_SECONDS);
                boolean expired = result.getDispatchedAt() != null
                        && result.getDispatchedAt().isBefore(hardCutoff);

                if (expired) {
                    log.warn("Token {} exceeded hard cutoff ({}s), marking RUNTIME_ERROR",
                            result.getJudge0Token(), HARD_CUTOFF_SECONDS);
                    resultProcessor.processRecoveredResult(
                            result,
                            Verdict.RUNTIME_ERROR,
                            null,
                            null,
                            "Judge0 submission timed out (no result after " + HARD_CUTOFF_SECONDS + "s)",
                            ""
                    );
                    continue;
                }
                
                if (result.getJudge0Token() != null) {
                    toPoll.add(result);
                } else {
                    resultProcessor.processRecoveredResult(result, Verdict.RUNTIME_ERROR, null, null, "Judge0 submission token missing", "");
                }
            } catch (Exception e) {
                log.warn("Failed to process stale result: {}", result.getSubmissionResultId(), e);
            }
        }

        if (!toPoll.isEmpty()) {
            recoverBatch(toPoll);
        }
    }

    private void recoverBatch(List<SubmissionResult> resultsToPoll) {
        List<String> tokens = resultsToPoll.stream().map(SubmissionResult::getJudge0Token).toList();
        try {
            List<Judge0Response> responses = judge0Client.getSubmissionsBatch(tokens);
            Map<String, Judge0Response> responseMap = responses.stream()
                    .collect(Collectors.toMap(Judge0Response::getToken, r -> r));

            for (SubmissionResult result : resultsToPoll) {
                try {
                    Judge0Response response = responseMap.get(result.getJudge0Token());
                    if (response == null || response.getStatus() == null) {
                        resultProcessor.processRecoveredResult(result, Verdict.RUNTIME_ERROR, null, null, "Judge0 has no record for this submission", "");
                        continue;
                    }

                    int statusId = response.getStatus().getId();

                    if (statusId <= 2) {
                        log.debug("Token {} still processing at Judge0 (status={}), will retry", result.getJudge0Token(), statusId);
                        continue;
                    }

                    Verdict verdict = ResultProcessor.mapVerdict(statusId);
                    if (verdict == null) verdict = Verdict.RUNTIME_ERROR;

                    Double timeMs = response.getTime() != null ? response.getTime() * 1000 : null;
                    Double memoryKb = response.getMemory() != null ? response.getMemory().doubleValue() : null;

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
                } catch (Exception e) {
                    log.error("Failed to process recovered result in batch for token {}", result.getJudge0Token(), e);
                }
            }
        } catch (Exception e) {
            log.error("Failed to recover batch of tokens", e);
        }
    }
}
