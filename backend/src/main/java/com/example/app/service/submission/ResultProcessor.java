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
            log.info("[CALLBACK] Skipping duplicate callback for token={}, existing verdict={}", payload.getToken(), result.getVerdict());
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

        Problem problem = result.getSubmission().getProblem();
        Double usedMemoryKb = payload.getMemory() != null ? payload.getMemory().doubleValue() : null;
        Double usedTimeSecs = payload.getTime() != null ? payload.getTime() : null;
        
        verdict = enforceResourceLimits(verdict, problem, usedMemoryKb, usedTimeSecs, "token " + payload.getToken());

        EvaluationType evalType = result.getSubmission().getProblem().getEvaluationType();
        
        if (evalType == EvaluationType.HEURISTIC && verdict == Verdict.ACCEPTED) {
            resultRepository.save(result);
            eventPublisher.publishEvent(new ScoringRequiredEvent(
                    result.getSubmission().getSubmissionId(),
                    result.getSubmissionResultId()));
            return;
        }

        // All other cases: set verdict and score normally
        result.setVerdict(verdict);

        if (verdict != Verdict.ACCEPTED) {
            String errorMsg = payload.getCompile_output();
            if (errorMsg == null) errorMsg = payload.getStderr();
            if (errorMsg == null) errorMsg = payload.getMessage();
            result.setErrorMessage(truncate(errorMsg));
        }

        if (verdict == Verdict.ACCEPTED) {
            result.setScore(result.getTestcase().getTestcasePoint());
        } else {
            result.setScore(0.0);
        }

        resultRepository.save(result);
        log.info("Successfully evaluated with verdict = {}", verdict);

        // Trigger aggregation check
        eventPublisher.publishEvent(new JudgeResultReceivedEvent(
                result.getSubmission().getSubmissionId()));
    }

    /**
     * Process a result recovered by JudgeTimeoutService (same logic, different input source).
     */
    @Transactional
    public void processRecoveredResult(
            SubmissionResult result,
            Verdict verdict,
            Double timeMs,
            Double memoryKb,
            String errorMessage,
            String stdout
    ) {
        if (result.getVerdict() != null) return;

        try {
            String userStdout = stdout != null ? stdout : "";
            storageService.saveSubmissionOutput(
                    result.getSubmission().getSubmissionId(),
                    result.getTestcase().getTestcaseId(),
                    userStdout);
        } catch (Exception ex) {
            log.warn("Failed to save recovered user output to S3 for result={}", result.getSubmissionResultId(), ex);
        }

        result.setTimeMs(timeMs);
        result.setMemoryKb(memoryKb);

        Problem problem = result.getSubmission().getProblem();
        Double usedTimeSecs = timeMs != null ? timeMs / 1000.0 : null;
        
        verdict = enforceResourceLimits(verdict, problem, memoryKb, usedTimeSecs, "recovered result " + result.getSubmissionResultId());

        EvaluationType evalType = problem.getEvaluationType();

        // HEURISTIC + ACCEPTED → don't set verdict/score, let scorer decide
        if (evalType == EvaluationType.HEURISTIC && verdict == Verdict.ACCEPTED) {
            resultRepository.save(result);
            log.debug("HEURISTIC recovered result {}: user code ACCEPTED → forwarding to scorer", result.getSubmissionResultId());
            eventPublisher.publishEvent(new ScoringRequiredEvent(
                    result.getSubmission().getSubmissionId(),
                    result.getSubmissionResultId()));
            return;
        }

        // All other cases: set verdict and score normally
        result.setVerdict(verdict);

        if (verdict == Verdict.ACCEPTED) {
            result.setScore(result.getTestcase().getTestcasePoint());
            result.setErrorMessage(null);
        } else {
            result.setScore(0.0);
            result.setErrorMessage(truncate(errorMessage));
        }

        resultRepository.save(result);
        log.info("Successfully evaluated with verdict = {}", verdict);

        eventPublisher.publishEvent(new JudgeResultReceivedEvent(
                result.getSubmission().getSubmissionId()));
    }

    /**
     * Re-trigger scoring for a heuristic result whose ScoringRequiredEvent was lost.
     */
    public void retriggerScoring(SubmissionResult result) {
        log.info("[RETRIGGER] Re-publishing ScoringRequiredEvent for result={}", result.getSubmissionResultId());
        eventPublisher.publishEvent(new ScoringRequiredEvent(
                result.getSubmission().getSubmissionId(),
                result.getSubmissionResultId()));
    }

    public static Verdict mapVerdict(Integer statusId) {
        if (statusId == null) return Verdict.RUNTIME_ERROR;
        return switch (statusId) {
            case 1, 2 -> null; // In Queue / Processing
            case 3 -> Verdict.ACCEPTED;
            case 4 -> Verdict.FAILED; // Wrong Answer
            case 5 -> Verdict.TIME_LIMIT;
            case 6 -> Verdict.COMPILE_ERROR;
            default -> Verdict.RUNTIME_ERROR;
        };
    }

    static String truncate(String s) {
        if (s == null) return null;
        return s.length() > 500 ? s.substring(0, 500) : s;
    }

    private Verdict enforceResourceLimits(Verdict currentVerdict, Problem problem, Double usedMemoryKb, Double usedTimeSecs, String logIdentifier) {
        if (currentVerdict == null || currentVerdict == Verdict.COMPILE_ERROR) {
            return currentVerdict;
        }

        Verdict newVerdict = currentVerdict;

        if (problem.getMemoryLimit() != null && usedMemoryKb != null) {
            int memoryLimitKb = problem.getMemoryLimit() * 1024;
            if (usedMemoryKb > memoryLimitKb) {
                newVerdict = Verdict.MEMORY_LIMIT;
                log.warn("Memory limit exceeded for {}: used={}KB, limit={}KB",
                        logIdentifier, usedMemoryKb, memoryLimitKb);
            }
        }

        if (problem.getTimeLimit() != null && usedTimeSecs != null) {
            if (usedTimeSecs > problem.getTimeLimit()) {
                newVerdict = Verdict.TIME_LIMIT;
                log.warn("Time limit exceeded for {}: used={}s, limit={}s",
                        logIdentifier, usedTimeSecs, problem.getTimeLimit());
            }
        }

        return newVerdict;
    }
}
