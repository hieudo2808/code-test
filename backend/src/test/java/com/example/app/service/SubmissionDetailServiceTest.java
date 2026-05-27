package com.example.app.service;

import com.example.app.dto.response.TestcaseDetailResponse;
import com.example.app.entity.Submission;
import com.example.app.entity.SubmissionResult;
import com.example.app.entity.Testcase;
import com.example.app.entity.Users;
import com.example.app.exception.AppException;
import com.example.app.exception.ErrorCode;
import com.example.app.repository.SubmissionRepository;
import com.example.app.repository.SubmissionResultRepository;
import com.example.app.security.SecurityHelper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class SubmissionDetailServiceTest {

    @Mock
    private SubmissionRepository submissionRepository;

    @Mock
    private SubmissionResultRepository resultRepository;

    @Mock
    private R2StorageService storageService;

    @Mock
    private SecurityHelper securityHelper;

    @InjectMocks
    private SubmissionDetailService submissionDetailService;

    @Test
    void testGetTestcaseDetail_Unauthorized_ThrowsForbidden() {
        // Arrange
        UUID submissionId = UUID.randomUUID();
        UUID testcaseId = UUID.randomUUID();

        Users submitter = Users.builder().userId(UUID.randomUUID()).build();
        Submission submission = Submission.builder()
                .submissionId(submissionId)
                .submitter(submitter)
                .build();

        when(submissionRepository.findById(submissionId)).thenReturn(Optional.of(submission));
        when(securityHelper.hasAuthority("SUBMISSION_READ_ALL")).thenReturn(false);
        when(securityHelper.getCurrentUserId()).thenReturn(UUID.randomUUID()); // Not the owner

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () -> {
            submissionDetailService.getTestcaseDetail(submissionId, testcaseId);
        });

        assertEquals(ErrorCode.FORBIDDEN, exception.getErrorCode());
    }

    @Test
    void testGetTestcaseDetail_HiddenTestcase_NotAdmin_ThrowsForbidden() {
        // Arrange
        UUID submissionId = UUID.randomUUID();
        UUID testcaseId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        Users submitter = Users.builder().userId(userId).build();
        Submission submission = Submission.builder()
                .submissionId(submissionId)
                .submitter(submitter)
                .build();

        Testcase testcase = Testcase.builder()
                .testcaseId(testcaseId)
                .isHidden(true)
                .inputPath("problems/prob-1/testcases/tc-1/input.txt")
                .outputPath("problems/prob-1/testcases/tc-1/output.txt")
                .build();

        SubmissionResult result = SubmissionResult.builder()
                .testcase(testcase)
                .build();

        when(submissionRepository.findById(submissionId)).thenReturn(Optional.of(submission));
        when(securityHelper.hasAuthority("SUBMISSION_READ_ALL")).thenReturn(false);
        when(securityHelper.getCurrentUserId()).thenReturn(userId); // Owner
        when(resultRepository.findBySubmissionSubmissionId(submissionId)).thenReturn(List.of(result));

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () -> {
            submissionDetailService.getTestcaseDetail(submissionId, testcaseId);
        });

        assertEquals(ErrorCode.FORBIDDEN, exception.getErrorCode());
    }

    @Test
    void testGetTestcaseDetail_HappyPath_DecodesBase64() {
        // Arrange
        UUID submissionId = UUID.randomUUID();
        UUID testcaseId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        Users submitter = Users.builder().userId(userId).build();
        Submission submission = Submission.builder()
                .submissionId(submissionId)
                .submitter(submitter)
                .build();

        Testcase testcase = Testcase.builder()
                .testcaseId(testcaseId)
                .isHidden(false)
                .inputPath("problems/prob-1/testcases/tc-1/input.txt")
                .outputPath("problems/prob-1/testcases/tc-1/output.txt")
                .build();

        SubmissionResult result = SubmissionResult.builder()
                .testcase(testcase)
                .build();

        when(submissionRepository.findById(submissionId)).thenReturn(Optional.of(submission));
        when(securityHelper.hasAuthority("SUBMISSION_READ_ALL")).thenReturn(false);
        when(securityHelper.getCurrentUserId()).thenReturn(userId); // Owner
        when(resultRepository.findBySubmissionSubmissionId(submissionId)).thenReturn(List.of(result));

        // Stub S3 storage reads with base64 encoded strings
        // "aW5wdXQ=" -> "input"
        // "b3V0cHV0" -> "output"
        // "YWN0dWFs" -> "actual"
        when(storageService.readAsString("problems/prob-1/testcases/tc-1/input.txt")).thenReturn("aW5wdXQ=");
        when(storageService.readAsString("problems/prob-1/testcases/tc-1/output.txt")).thenReturn("b3V0cHV0");
        when(storageService.readAsString("submissions/" + submissionId + "/results/" + testcaseId + "/output.txt")).thenReturn("YWN0dWFs");

        // Act
        TestcaseDetailResponse response = submissionDetailService.getTestcaseDetail(submissionId, testcaseId);

        // Assert
        assertNotNull(response);
        assertEquals("input", response.getInput());
        assertEquals("output", response.getExpectedOutput());
        assertEquals("actual", response.getActualOutput());
    }
}
