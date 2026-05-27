package com.example.app.service;

import com.example.app.entity.Problem;
import com.example.app.entity.Submission;
import com.example.app.entity.SubmissionResult;
import com.example.app.entity.Testcase;
import com.example.app.entity.Users;
import com.example.app.repository.ProblemRepository;
import com.example.app.repository.SubmissionResultRepository;
import com.example.app.repository.TestcaseRepository;
import com.example.app.security.SecurityHelper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TestcaseDeleteCleanupTest {

    @Mock
    private TestcaseRepository testcaseRepository;

    @Mock
    private ProblemRepository problemRepository;

    @Mock
    private SubmissionResultRepository submissionResultRepository;

    @Mock
    private R2StorageService storageService;

    @Mock
    private SecurityHelper securityHelper;

    @InjectMocks
    private TestcaseService testcaseService;

    @Test
    void testDeleteTestcase_CleansS3Files() {
        // Arrange
        UUID testcaseId = UUID.randomUUID();
        UUID problemId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID submissionId = UUID.randomUUID();

        Users creator = Users.builder()
                .userId(userId)
                .build();

        Problem problem = Problem.builder()
                .problemId(problemId)
                .problemCreator(creator)
                .build();

        Testcase testcase = Testcase.builder()
                .testcaseId(testcaseId)
                .problem(problem)
                .inputPath("problems/prob-1/testcases/tc-1/input.txt")
                .outputPath("problems/prob-1/testcases/tc-1/output.txt")
                .build();

        Submission submission = Submission.builder()
                .submissionId(submissionId)
                .build();

        SubmissionResult result = SubmissionResult.builder()
                .submission(submission)
                .build();

        when(testcaseRepository.findById(testcaseId)).thenReturn(Optional.of(testcase));
        when(securityHelper.getCurrentUserId()).thenReturn(userId);

        when(submissionResultRepository.findByTestcaseTestcaseId(testcaseId)).thenReturn(List.of(result));
        when(testcaseRepository.sumTestcasePointsByProblemId(problemId)).thenReturn(100.0);

        // Act
        testcaseService.deleteTestcase(testcaseId);

        // Assert
        // Verify S3 user output deletion
        String expectedUserOutputPath = String.format("submissions/%s/results/%s/output.txt", submissionId, testcaseId);
        verify(storageService).delete(expectedUserOutputPath);

        // Verify S3 testcase files deletion
        verify(storageService).delete("problems/prob-1/testcases/tc-1/input.txt");
        verify(storageService).delete("problems/prob-1/testcases/tc-1/output.txt");

        // Verify DB deletion calls
        verify(submissionResultRepository).deleteByTestcaseTestcaseId(testcaseId);
        verify(testcaseRepository).delete(testcase);

        // Verify max score sync
        verify(problemRepository).save(problem);
    }
}
