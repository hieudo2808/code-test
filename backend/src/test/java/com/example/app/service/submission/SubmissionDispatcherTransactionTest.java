package com.example.app.service.submission;

import com.example.app.entity.Problem;
import com.example.app.entity.Submission;
import com.example.app.entity.enums.EvaluationType;
import com.example.app.entity.enums.SubmissionStatus;
import com.example.app.repository.ProblemRepository;
import com.example.app.repository.SubmissionRepository;
import com.example.app.service.Judge0Client;
import com.example.app.service.R2StorageService;
import com.example.app.service.submission.event.SubmissionCreatedEvent;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;

@SpringBootTest
public class SubmissionDispatcherTransactionTest {

    @Autowired
    private SubmissionOrchestrator orchestrator;

    @Autowired
    private SubmissionRepository submissionRepository;

    @Autowired
    private ProblemRepository problemRepository;

    @MockitoBean
    private Judge0Client judge0Client;

    @MockitoBean
    private R2StorageService s3StorageService;

    @Test
    void testDispatchTransactionRollbackOnException() {
        Problem problem = Problem.builder()
                .title("Test Problem TX")
                .slug("test-problem-tx-" + UUID.randomUUID())
                .evaluationType(EvaluationType.EXACT)
                .isPublic(true)
                .build();
        problem = problemRepository.save(problem);

        Submission submission = Submission.builder()
                .problem(problem)
                .sourceCode("print(1)")
                .languageId(71)
                .submissionStatus(SubmissionStatus.PENDING)
                .build();
        submission = submissionRepository.save(submission);

        // Force submitBatch to fail, triggering the catch block
        doThrow(new RuntimeException("Simulated external service failure"))
                .when(judge0Client).submitBatch(any());

        final UUID submissionId = submission.getSubmissionId();

        try {
            orchestrator.handleSubmissionCreated(new SubmissionCreatedEvent(submissionId));
        } catch (Exception ignored) {
        }

        // Wait for the async execution to finish and write to database (polling up to 5 seconds)
        Submission finalSubmission = null;
        for (int i = 0; i < 50; i++) {
            finalSubmission = submissionRepository.findById(submissionId).orElseThrow();
            if (finalSubmission.getSubmissionStatus() == SubmissionStatus.ERROR) {
                break;
            }
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        // Assert that the status is now correctly updated to ERROR in the database
        assertEquals(SubmissionStatus.ERROR, finalSubmission.getSubmissionStatus(),
                "Expected status to be ERROR when external dispatch fails, but it was rolled back!");
    }
}
