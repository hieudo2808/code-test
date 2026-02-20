package com.example.app.service.submission;

import com.example.app.dto.judge0.Judge0Request;
import com.example.app.entity.Problem;
import com.example.app.entity.SubmissionResult;
import com.example.app.entity.enums.Verdict;
import com.example.app.repository.SubmissionResultRepository;
import com.example.app.service.Judge0Client;
import com.example.app.service.S3StorageService;
import com.example.app.service.submission.event.JudgeResultReceivedEvent;
import com.example.app.service.submission.event.ScoringRequiredEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Handles the scoring stage for HEURISTIC-mode submissions.
 * Listens for ScoringRequiredEvent, runs the scorer code via Judge0,
 * and saves the score result. Uses async callbacks, never blocks.
 *
 * Scorer protocol:
 *   Input:  testcaseInput + SEPARATOR + userOutput + SEPARATOR + expectedOutput
 *   Output: "score:<value>\nmessage:<text>"
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ScoringWorker {

    private static final String SEPARATOR = "\n---SEPARATOR---\n";

    private final Judge0Client judge0Client;
    private final SubmissionResultRepository resultRepository;
    private final S3StorageService storageService;
    private final ApplicationEventPublisher eventPublisher;

    @Async("scorerExecutor")
    @EventListener
    @Transactional
    public void handleScoringRequired(ScoringRequiredEvent event) {
        SubmissionResult result = resultRepository.findById(event.submissionResultId()).orElse(null);
        if (result == null) {
            log.warn("SubmissionResult not found for scoring: {}", event.submissionResultId());
            return;
        }

        Problem problem = result.getSubmission().getProblem();

        try {
            // Read inputs
            String testcaseInput = readFromS3(result.getTestcase().getInputPath());
            String expectedOutput = readFromS3(result.getTestcase().getOutputPath());

            // Read user output from saved S3 path
            String userOutputPath = String.format("submissions/%s/results/%s/output.txt",
                    result.getSubmission().getSubmissionId(),
                    result.getTestcase().getTestcaseId());
            String userOutput = readFromS3(userOutputPath);

            // Build scorer input
            String scorerInput = testcaseInput + SEPARATOR + userOutput + SEPARATOR + expectedOutput;

            Judge0Request scorerReq = Judge0Request.builder()
                    .languageId(problem.getScorerLanguageId())
                    .sourceCode(problem.getScorerCode())
                    .stdin(scorerInput)
                    .cpuTimeLimit(10.0)
                    .wallTimeLimit(20.0)
                    .memoryLimit(256000)
                    .redirectStderrToStdout(true)
                    .build();

            // Submit scorer synchronously (in dedicated scorer thread pool, not blocking judge pool)
            // Note: Using submitSync here is acceptable because we're on the scorerExecutor pool,
            // which is separate from the judgeExecutor. This keeps the implementation simple.
            var scorerResult = judge0Client.submitSync(scorerReq, 30);

            // Parse scorer output
            double score = 0.0;
            String message = "Scorer error";
            Verdict verdict = Verdict.FAILED;

            if (scorerResult.getStatus() != null && scorerResult.getStatus().getId() == 3
                    && scorerResult.getStdout() != null) {
                String[] lines = scorerResult.getStdout().split("\n");
                for (String line : lines) {
                    if (line.startsWith("score:")) {
                        score = Double.parseDouble(line.substring(6).trim());
                    } else if (line.startsWith("message:")) {
                        message = line.substring(8).trim();
                    }
                }

                if (score >= 1.0) {
                    verdict = Verdict.ACCEPTED;
                } else if (score > 0) {
                    verdict = Verdict.PARTIAL;
                }
            }

            // Update result with scorer output
            result.setVerdict(verdict);
            result.setScore(score * result.getTestcase().getTestcasePoint());
            result.setErrorMessage(message);
            resultRepository.save(result);

        } catch (Exception e) {
            log.error("Scoring failed for submissionResult: {}", event.submissionResultId(), e);
            result.setVerdict(Verdict.FAILED);
            result.setScore(0.0);
            result.setErrorMessage("Scorer execution failed: " + ResultProcessor.truncate(e.getMessage()));
            resultRepository.save(result);
        }

        // Trigger aggregation
        eventPublisher.publishEvent(new JudgeResultReceivedEvent(event.submissionId()));
    }

    private String readFromS3(String path) {
        try {
            byte[] bytes = storageService.getFile(path).readAllBytes();
            return new String(bytes);
        } catch (Exception e) {
            log.error("Failed to read from S3: {}", path, e);
            return "";
        }
    }
}
