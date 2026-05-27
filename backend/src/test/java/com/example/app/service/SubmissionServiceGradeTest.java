package com.example.app.service;

import com.example.app.dto.request.submission.ManualGradeRequest;
import com.example.app.dto.response.SubmissionResponse;
import com.example.app.entity.Problem;
import com.example.app.entity.Submission;
import com.example.app.entity.enums.EvaluationType;
import com.example.app.entity.enums.SubmissionStatus;
import com.example.app.entity.enums.Verdict;
import com.example.app.exception.AppException;
import com.example.app.exception.ErrorCode;
import com.example.app.mapper.SubmissionMapper;
import com.example.app.repository.*;
import com.example.app.security.SecurityHelper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SubmissionServiceGradeTest {

    @Mock
    private SubmissionRepository submissionRepository;
    @Mock
    private SubmissionResultRepository resultRepository;
    @Mock
    private ProblemRepository problemRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ContestRepository contestRepository;
    @Mock
    private ContestService contestService;
    @Mock
    private R2StorageService storageService;
    @Mock
    private SubmissionMapper submissionMapper;
    @Mock
    private SecurityHelper securityHelper;
    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private SubmissionService submissionService;

    @Test
    void testManualGrade_StatusNotGradable_ThrowsException() {
        // Arrange
        UUID submissionId = UUID.randomUUID();
        Submission submission = Submission.builder()
                .submissionId(submissionId)
                .submissionStatus(SubmissionStatus.PENDING)
                .build();

        when(submissionRepository.findById(submissionId)).thenReturn(Optional.of(submission));

        ManualGradeRequest request = new ManualGradeRequest();
        request.setScore(50.0);
        request.setVerdict(Verdict.ACCEPTED);

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () -> {
            submissionService.manualGrade(submissionId, request);
        });

        assertEquals(ErrorCode.SUBMISSION_NOT_GRADABLE, exception.getErrorCode());
    }

    @Test
    void testManualGrade_ScoreOutOfRange_ThrowsException() {
        // Arrange
        UUID submissionId = UUID.randomUUID();
        Problem problem = Problem.builder()
                .maxScore(100.0)
                .build();
        Submission submission = Submission.builder()
                .submissionId(submissionId)
                .submissionStatus(SubmissionStatus.NEED_REVIEW)
                .problem(problem)
                .build();

        when(submissionRepository.findById(submissionId)).thenReturn(Optional.of(submission));

        ManualGradeRequest request = new ManualGradeRequest();
        request.setScore(105.0); // exceeds max score
        request.setVerdict(Verdict.ACCEPTED);

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () -> {
            submissionService.manualGrade(submissionId, request);
        });

        assertEquals(ErrorCode.SCORE_OUT_OF_RANGE, exception.getErrorCode());
    }

    @Test
    void testManualGrade_Success() {
        // Arrange
        UUID submissionId = UUID.randomUUID();
        Problem problem = Problem.builder()
                .maxScore(100.0)
                .build();
        Submission submission = Submission.builder()
                .submissionId(submissionId)
                .submissionStatus(SubmissionStatus.NEED_REVIEW)
                .problem(problem)
                .build();

        when(submissionRepository.findById(submissionId)).thenReturn(Optional.of(submission));
        when(submissionRepository.save(any(Submission.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SubmissionResponse expectedResponse = SubmissionResponse.builder().build();
        when(submissionMapper.toResponse(any(Submission.class))).thenReturn(expectedResponse);

        ManualGradeRequest request = new ManualGradeRequest();
        request.setScore(85.0);
        request.setVerdict(Verdict.PARTIAL);

        // Act
        SubmissionResponse result = submissionService.manualGrade(submissionId, request);

        // Assert
        verify(submissionRepository, times(1)).save(submission);
        assertEquals(SubmissionStatus.DONE, submission.getSubmissionStatus());
        assertEquals(85.0, submission.getFinalScore());
        assertEquals(Verdict.PARTIAL, submission.getFinalVerdict());
        assertEquals(expectedResponse, result);
    }
}
