package com.example.app.service;

import com.example.app.entity.Problem;
import com.example.app.entity.Submission;
import com.example.app.entity.SubmissionResult;
import com.example.app.entity.enums.EvaluationType;
import com.example.app.entity.enums.SubmissionStatus;
import com.example.app.entity.enums.Verdict;
import com.example.app.repository.SubmissionResultRepository;
import com.example.app.service.submission.ResultProcessor;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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

    @Test
    void testRecoverStaleResults_HardCutoffTimeoutMessage() {
        Problem problem = Problem.builder()
                .evaluationType(EvaluationType.EXACT)
                .build();

        Submission submission = Submission.builder()
                .problem(problem)
                .updateAt(OffsetDateTime.now().minusSeconds(310)) // Over 300s
                .build();

        SubmissionResult result = SubmissionResult.builder()
                .submission(submission)
                .judge0Token("test-token")
                .build();

        when(resultRepository.findStaleResults(eq(SubmissionStatus.RUNNING), any(OffsetDateTime.class)))
                .thenReturn(Collections.singletonList(result));

        judgeTimeoutService.recoverStaleResults();

        ArgumentCaptor<String> messageCaptor = ArgumentCaptor.forClass(String.class);
        verify(resultProcessor).processRecoveredResult(
                eq(result),
                eq(Verdict.RUNTIME_ERROR),
                any(),
                any(),
                messageCaptor.capture(),
                eq("")
        );

        assertEquals("Judge0 submission timed out (no result after 300s)", messageCaptor.getValue());
    }
}
