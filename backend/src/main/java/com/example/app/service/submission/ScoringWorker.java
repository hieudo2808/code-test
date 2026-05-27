package com.example.app.service.submission;

import com.example.app.dto.judge0.Judge0Request;
import com.example.app.entity.Problem;
import com.example.app.entity.SubmissionResult;
import com.example.app.entity.enums.Verdict;
import com.example.app.repository.SubmissionResultRepository;
import com.example.app.service.Judge0Client;
import com.example.app.service.R2StorageService;
import com.example.app.service.submission.event.JudgeResultReceivedEvent;
import com.example.app.service.submission.event.ScoringRequiredEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.beans.factory.annotation.Value;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScoringWorker {
    private static final String SEPARATOR = "\n---SEPARATOR---\n";

    @Value("${judge0.callback-url}")
    private String callbackUrl;

    private final Judge0Client judge0Client;
    private final SubmissionResultRepository resultRepository;
    private final R2StorageService storageService;
    private final ApplicationEventPublisher eventPublisher;

    @Async("scorerExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleScoringRequired(ScoringRequiredEvent event) {
        SubmissionResult result = resultRepository.findById(event.submissionResultId()).orElse(null);
        if (result == null) {
            log.warn("[SCORER] SubmissionResult not found for scoring: {}", event.submissionResultId());
            return;
        }

        Problem problem = result.getSubmission().getProblem();

        try {
            String testcaseInput = storageService.readAsString(result.getTestcase().getInputPath());
            String expectedOutput = storageService.readAsString(result.getTestcase().getOutputPath());

            String userOutputPath = String.format("submissions/%s/results/%s/output.txt",
                    result.getSubmission().getSubmissionId(),
                    result.getTestcase().getTestcaseId());
            String userOutput = storageService.readAsString(userOutputPath);

            String scorerInput = testcaseInput + SEPARATOR + userOutput + SEPARATOR + expectedOutput;

            String scorerCallbackUrl = callbackUrl + "/scorer-callback/" + result.getSubmissionResultId();

            Judge0Request scorerReq = Judge0Request.builder()
                    .languageId(problem.getScorerLanguageId())
                    .sourceCode(problem.getScorerCode())
                    .stdin(scorerInput)
                    .cpuTimeLimit(10.0)
                    .wallTimeLimit(20.0)
                    .memoryLimit(256000)
                    .redirectStderrToStdout(true)
                    .callbackUrl(scorerCallbackUrl)
                    .build();

            // Submit asynchronously
            judge0Client.submitBatch(java.util.List.of(scorerReq));
            log.info("[SCORER] Submitted async scoring job for resultId={}", result.getSubmissionResultId());

        } catch (Exception e) {
            log.error("[SCORER] FAILED to submit for submissionId={}, resultId={}: {}",
                    event.submissionId(), event.submissionResultId(), e.getMessage(), e);
            result.setVerdict(Verdict.FAILED);
            result.setScore(0.0);
            result.setErrorMessage("Scorer submission failed: " + ResultProcessor.truncate(e.getMessage()));
            resultRepository.save(result);
            eventPublisher.publishEvent(new JudgeResultReceivedEvent(event.submissionId()));
        }
    }
}
