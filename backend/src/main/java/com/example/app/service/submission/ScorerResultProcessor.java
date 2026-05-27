package com.example.app.service.submission;

import com.example.app.dto.judge0.Judge0CallbackPayload;
import com.example.app.entity.SubmissionResult;
import com.example.app.entity.enums.Verdict;
import com.example.app.repository.SubmissionResultRepository;
import com.example.app.service.submission.event.JudgeResultReceivedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScorerResultProcessor {
    private final SubmissionResultRepository resultRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public void processCallback(UUID submissionResultId, Judge0CallbackPayload payload) {
        SubmissionResult result = resultRepository.findById(submissionResultId).orElse(null);
        if (result == null) {
            log.warn("[SCORER_CALLBACK] SubmissionResult not found: {}", submissionResultId);
            return;
        }

        double score = 0.0;
        String message = "Scorer error";
        Verdict verdict = Verdict.FAILED;

        if (payload.getStatus() != null && payload.getStatus().getId() == 3 && payload.getStdout() != null) {
            String[] lines = payload.getStdout().split("\n");
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
        } else {
            String errorMsg = payload.getCompile_output();
            if (errorMsg == null) errorMsg = payload.getStderr();
            if (errorMsg == null) errorMsg = payload.getMessage();
            message = "Scorer error: " + ResultProcessor.truncate(errorMsg);
        }

        result.setVerdict(verdict);
        result.setScore(score * result.getTestcase().getTestcasePoint());
        result.setErrorMessage(message);
        resultRepository.save(result);

        eventPublisher.publishEvent(new JudgeResultReceivedEvent(result.getSubmission().getSubmissionId()));
    }
}
