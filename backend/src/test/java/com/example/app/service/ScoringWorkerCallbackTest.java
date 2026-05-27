package com.example.app.service;

import com.example.app.dto.judge0.Judge0CallbackPayload;
import com.example.app.dto.judge0.Judge0CallbackPayload.Judge0Status;
import com.example.app.entity.Problem;
import com.example.app.entity.Submission;
import com.example.app.entity.SubmissionResult;
import com.example.app.entity.Testcase;
import com.example.app.entity.enums.Verdict;
import com.example.app.repository.SubmissionResultRepository;
import com.example.app.service.submission.ScorerResultProcessor;
import com.example.app.service.submission.event.JudgeResultReceivedEvent;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ScoringWorkerCallbackTest {

    @Mock
    private SubmissionResultRepository resultRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private ScorerResultProcessor scorerResultProcessor;

    @Test
    void testProcessCallback_AcceptedScore() {
        // Arrange
        UUID submissionResultId = UUID.randomUUID();
        UUID submissionId = UUID.randomUUID();

        Problem problem = new Problem();
        problem.setProblemId(UUID.randomUUID());

        Submission submission = new Submission();
        submission.setSubmissionId(submissionId);
        submission.setProblem(problem);

        Testcase testcase = new Testcase();
        testcase.setTestcasePoint(10.0);

        SubmissionResult result = new SubmissionResult();
        result.setSubmissionResultId(submissionResultId);
        result.setSubmission(submission);
        result.setTestcase(testcase);

        when(resultRepository.findById(submissionResultId)).thenReturn(Optional.of(result));

        Judge0Status status = new Judge0Status();
        status.setId(3);
        status.setDescription("Accepted");
        
        Judge0CallbackPayload payload = new Judge0CallbackPayload();
        payload.setStatus(status);
        payload.setStdout(Base64.getEncoder().encodeToString("score: 1.0\nmessage: Great job!".getBytes()));

        // Act
        scorerResultProcessor.processCallback(submissionResultId, payload);

        // Assert
        verify(resultRepository).save(result);
        assertEquals(Verdict.ACCEPTED, result.getVerdict());
        assertEquals(10.0, result.getScore());
        assertEquals("Great job!", result.getErrorMessage());

        verify(eventPublisher).publishEvent(any(JudgeResultReceivedEvent.class));
    }

    @Test
    void testProcessCallback_PartialScore() {
        // Arrange
        UUID submissionResultId = UUID.randomUUID();
        UUID submissionId = UUID.randomUUID();

        Submission submission = new Submission();
        submission.setSubmissionId(submissionId);

        Testcase testcase = new Testcase();
        testcase.setTestcasePoint(10.0);

        SubmissionResult result = new SubmissionResult();
        result.setSubmissionResultId(submissionResultId);
        result.setSubmission(submission);
        result.setTestcase(testcase);

        when(resultRepository.findById(submissionResultId)).thenReturn(Optional.of(result));

        Judge0Status status = new Judge0Status();
        status.setId(3);
        status.setDescription("Accepted");
        
        Judge0CallbackPayload payload = new Judge0CallbackPayload();
        payload.setStatus(status);
        payload.setStdout(Base64.getEncoder().encodeToString("score: 0.5\nmessage: Partial match".getBytes()));

        // Act
        scorerResultProcessor.processCallback(submissionResultId, payload);

        // Assert
        verify(resultRepository).save(result);
        assertEquals(Verdict.PARTIAL, result.getVerdict());
        assertEquals(5.0, result.getScore());
        assertEquals("Partial match", result.getErrorMessage());

        verify(eventPublisher).publishEvent(any(JudgeResultReceivedEvent.class));
    }

    @Test
    void testProcessCallback_FailedScore() {
        // Arrange
        UUID submissionResultId = UUID.randomUUID();
        UUID submissionId = UUID.randomUUID();

        Submission submission = new Submission();
        submission.setSubmissionId(submissionId);

        Testcase testcase = new Testcase();
        testcase.setTestcasePoint(10.0);

        SubmissionResult result = new SubmissionResult();
        result.setSubmissionResultId(submissionResultId);
        result.setSubmission(submission);
        result.setTestcase(testcase);

        when(resultRepository.findById(submissionResultId)).thenReturn(Optional.of(result));

        Judge0Status status = new Judge0Status();
        status.setId(3);
        status.setDescription("Accepted");
        
        Judge0CallbackPayload payload = new Judge0CallbackPayload();
        payload.setStatus(status);
        payload.setStdout(Base64.getEncoder().encodeToString("score: 0.0\nmessage: Complete mismatch".getBytes()));

        // Act
        scorerResultProcessor.processCallback(submissionResultId, payload);

        // Assert
        verify(resultRepository).save(result);
        assertEquals(Verdict.FAILED, result.getVerdict());
        assertEquals(0.0, result.getScore());
        assertEquals("Complete mismatch", result.getErrorMessage());

        verify(eventPublisher).publishEvent(any(JudgeResultReceivedEvent.class));
    }

    @Test
    void testProcessCallback_CompilationError() {
        // Arrange
        UUID submissionResultId = UUID.randomUUID();
        UUID submissionId = UUID.randomUUID();

        Submission submission = new Submission();
        submission.setSubmissionId(submissionId);

        Testcase testcase = new Testcase();
        testcase.setTestcasePoint(10.0);

        SubmissionResult result = new SubmissionResult();
        result.setSubmissionResultId(submissionResultId);
        result.setSubmission(submission);
        result.setTestcase(testcase);

        when(resultRepository.findById(submissionResultId)).thenReturn(Optional.of(result));

        Judge0Status status = new Judge0Status();
        status.setId(6);
        status.setDescription("Compilation Error");
        
        Judge0CallbackPayload payload = new Judge0CallbackPayload();
        payload.setStatus(status);
        payload.setCompile_output(Base64.getEncoder().encodeToString("syntax error".getBytes()));

        // Act
        scorerResultProcessor.processCallback(submissionResultId, payload);

        // Assert
        verify(resultRepository).save(result);
        assertEquals(Verdict.FAILED, result.getVerdict());
        assertEquals(0.0, result.getScore());
        assertEquals("Scorer error: syntax error", result.getErrorMessage());

        verify(eventPublisher).publishEvent(any(JudgeResultReceivedEvent.class));
    }
}
