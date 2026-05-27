package com.example.app.service;

import com.example.app.dto.judge0.Judge0Response;
import com.example.app.entity.Problem;
import com.example.app.entity.Submission;
import com.example.app.entity.SubmissionResult;
import com.example.app.entity.enums.EvaluationType;
import com.example.app.entity.enums.Verdict;
import com.example.app.repository.SubmissionResultRepository;
import com.example.app.service.submission.ResultProcessor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class JudgeTimeoutServiceTest {

    @Mock
    private SubmissionResultRepository resultRepository;

    @Mock
    private Judge0Client judge0Client;

    @Mock
    private ResultProcessor resultProcessor;

    @InjectMocks
    private JudgeTimeoutService judgeTimeoutService;

    private Problem problem;
    private Submission submission;

    @BeforeEach
    void setUp() {
        problem = Problem.builder().evaluationType(EvaluationType.EXACT).build();
        submission = Submission.builder().problem(problem).build();
    }

    @Test
    void testRecoverStaleResults_PollingAndHardTimeout() {
        // Arrange
        SubmissionResult resultPoll = SubmissionResult.builder()
                .submissionResultId(UUID.randomUUID())
                .judge0Token("token-poll")
                .submission(submission)
                .dispatchedAt(OffsetDateTime.now().minusSeconds(100)) // > 60s, < 300s
                .build();

        SubmissionResult resultHardTimeout = SubmissionResult.builder()
                .submissionResultId(UUID.randomUUID())
                .judge0Token("token-hard")
                .submission(submission)
                .dispatchedAt(OffsetDateTime.now().minusSeconds(310)) // > 300s
                .build();

        when(resultRepository.findStaleResultsByDispatchTime(any(OffsetDateTime.class), any(Pageable.class)))
                .thenReturn(Arrays.asList(resultPoll, resultHardTimeout));

        Judge0Response response = new Judge0Response();
        response.setToken("token-poll");
        Judge0Response.Judge0Status status = new Judge0Response.Judge0Status();
        status.setId(3);
        status.setDescription("Accepted");
        response.setStatus(status);
        
        when(judge0Client.getSubmissionsBatch(Arrays.asList("token-poll")))
                .thenReturn(Collections.singletonList(response));

        // Act
        judgeTimeoutService.recoverStaleResults();

        // Assert
        // 1. resultPoll should be recovered via ResultProcessor with ACCEPTED
        verify(resultProcessor).processRecoveredResult(
                eq(resultPoll), eq(Verdict.ACCEPTED), any(), any(), any(), any()
        );

        // 2. resultHardTimeout should be marked RUNTIME_ERROR directly without polling
        verify(resultProcessor).processRecoveredResult(
                eq(resultHardTimeout), eq(Verdict.RUNTIME_ERROR), any(), any(), contains("Judge0 submission timed out"), anyString()
        );

        // 3. judge0Client should be called via batch poll exactly once with the tokens that need polling
        verify(judge0Client).getSubmissionsBatch(Arrays.asList("token-poll"));
        // Make sure it doesn't poll single tokens (no N+1 problem)
        verify(judge0Client, never()).getSubmission(anyString());
    }
}
