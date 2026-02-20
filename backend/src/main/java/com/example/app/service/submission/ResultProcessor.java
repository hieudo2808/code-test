package com.example.app.service.submission;

import com.example.app.dto.judge0.Judge0CallbackPayload;
import com.example.app.entity.Problem;
import com.example.app.entity.SubmissionResult;
import com.example.app.entity.enums.Verdict;
import com.example.app.exception.AppException;
import com.example.app.exception.ErrorCode;
import com.example.app.repository.SubmissionResultRepository;
import com.example.app.service.S3StorageService;
import com.example.app.service.submission.event.JudgeResultReceivedEvent;
import com.example.app.service.submission.event.ScoringRequiredEvent;
import com.example.app.entity.enums.EvaluationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Handles Judge0 callbacks. Idempotent: skips if verdict already set.
 * After processing, publishes JudgeResultReceivedEvent for aggregation.
 * For heuristic problems with ACCEPTED user-run, publishes ScoringRequiredEvent.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ResultProcessor {

    private final SubmissionResultRepository resultRepository;
    private final S3StorageService storageService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public void processCallback(Judge0CallbackPayload payload) {
        SubmissionResult result = resultRepository.findByJudge0Token(payload.getToken())
                .orElseThrow(() -> {
                    log.warn("Unknown Judge0 token: {}", payload.getToken());
                    return new AppException(ErrorCode.SUBMISSION_NOT_FOUND);
                });

        // Idempotency guard: skip if already processed
        if (result.getVerdict() != null) {
            log.debug("Skipping duplicate callback for token: {}", payload.getToken());
            return;
        }

        // Save user output to S3
        try {
            String userStdout = payload.getStdout() != null ? payload.getStdout() : "";
            storageService.saveSubmissionOutput(
                    result.getSubmission().getSubmissionId(),
                    result.getTestcase().getTestcaseId(),
                    userStdout);
        } catch (Exception ex) {
            log.warn("Failed to save user output to S3 for token={}", payload.getToken(), ex);
        }

        // Map Judge0 status to verdict
        Verdict verdict = mapVerdict(payload.getStatus().getId());
        result.setTimeMs(payload.getTime() != null ? payload.getTime() * 1000 : null);
        result.setMemoryKb(payload.getMemory() != null ? payload.getMemory().doubleValue() : null);

        // Double-check resource limits even if Judge0 says Accepted
        if (verdict == Verdict.ACCEPTED) {
            Problem problem = result.getSubmission().getProblem();

            if (problem.getMemoryLimit() != null && payload.getMemory() != null) {
                int memoryLimitKb = problem.getMemoryLimit() * 1024;
                if (payload.getMemory() > memoryLimitKb) {
                    verdict = Verdict.MEMORY_LIMIT;
                    log.warn("Memory limit exceeded for token {}: used={}KB, limit={}KB",
                            payload.getToken(), payload.getMemory(), memoryLimitKb);
                }
            }

            if (problem.getTimeLimit() != null && payload.getTime() != null) {
                if (payload.getTime() > problem.getTimeLimit()) {
                    verdict = Verdict.TIME_LIMIT;
                    log.warn("Time limit exceeded for token {}: used={}s, limit={}s",
                            payload.getToken(), payload.getTime(), problem.getTimeLimit());
                }
            }
        }

        result.setVerdict(verdict);

        // Set error message for non-accepted verdicts
        if (verdict != Verdict.ACCEPTED) {
            String errorMsg = payload.getCompile_output();
            if (errorMsg == null) errorMsg = payload.getStderr();
            if (errorMsg == null) errorMsg = payload.getMessage();
            result.setErrorMessage(truncate(errorMsg));
        }

        // Set score based on verdict
        if (verdict == Verdict.ACCEPTED) {
            result.setScore(result.getTestcase().getTestcasePoint());
        } else {
            result.setScore(0.0);
        }

        resultRepository.save(result);
        log.debug("Processed callback for token: {}, verdict: {}", payload.getToken(), verdict);

        // Check if this is a heuristic problem and user code succeeded → need scoring
        EvaluationType evalType = result.getSubmission().getProblem().getEvaluationType();
        if (evalType == EvaluationType.HEURISTIC && verdict == Verdict.ACCEPTED) {
            eventPublisher.publishEvent(new ScoringRequiredEvent(
                    result.getSubmission().getSubmissionId(),
                    result.getSubmissionResultId()));
        } else {
            // Trigger aggregation check
            eventPublisher.publishEvent(new JudgeResultReceivedEvent(
                    result.getSubmission().getSubmissionId()));
        }
    }

    /**
     * Process a result recovered by JudgeTimeoutService (same logic, different input source).
     */
    @Transactional
    public void processRecoveredResult(SubmissionResult result, Verdict verdict,
                                        Double timeMs, Double memoryKb, String errorMessage) {
        // Idempotency guard
        if (result.getVerdict() != null) return;

        result.setVerdict(verdict);
        result.setTimeMs(timeMs);
        result.setMemoryKb(memoryKb);
        result.setErrorMessage(truncate(errorMessage));

        if (verdict == Verdict.ACCEPTED) {
            result.setScore(result.getTestcase().getTestcasePoint());
        } else {
            result.setScore(0.0);
        }

        resultRepository.save(result);

        eventPublisher.publishEvent(new JudgeResultReceivedEvent(
                result.getSubmission().getSubmissionId()));
    }

    public static Verdict mapVerdict(Integer statusId) {
        if (statusId == null) return Verdict.RUNTIME_ERROR;
        return switch (statusId) {
            case 1, 2 -> null; // In Queue / Processing
            case 3 -> Verdict.ACCEPTED;
            case 4 -> Verdict.FAILED; // Wrong Answer
            case 5 -> Verdict.TIME_LIMIT;
            case 6 -> Verdict.COMPILE_ERROR;
            case 7, 8, 9, 10, 11, 12 -> Verdict.RUNTIME_ERROR;
            default -> Verdict.RUNTIME_ERROR;
        };
    }

    static String truncate(String s) {
        if (s == null) return null;
        return s.length() > 500 ? s.substring(0, 500) : s;
    }
}
