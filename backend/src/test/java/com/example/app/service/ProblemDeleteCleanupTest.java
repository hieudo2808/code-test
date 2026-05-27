package com.example.app.service;

import com.example.app.entity.Problem;
import com.example.app.entity.Submission;
import com.example.app.entity.SubmissionResult;
import com.example.app.entity.Testcase;
import com.example.app.repository.ContestProblemRepository;
import com.example.app.repository.ProblemRepository;
import com.example.app.repository.SubmissionResultRepository;
import com.example.app.repository.TestcaseRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ProblemDeleteCleanupTest {

    @Mock
    private ProblemRepository problemRepository;

    @Mock
    private ContestProblemRepository contestProblemRepository;

    @Mock
    private TestcaseRepository testcaseRepository;

    @Mock
    private SubmissionResultRepository submissionResultRepository;

    @Mock
    private R2StorageService storageService;

    @InjectMocks
    private ProblemService problemService;

    @Test
    void testDeleteProblem_CleansS3Files() {
        // Arrange
        UUID problemId = UUID.randomUUID();
        UUID testcaseId = UUID.randomUUID();
        UUID submissionId = UUID.randomUUID();

        when(problemRepository.existsById(problemId)).thenReturn(true);

        Testcase testcase = Testcase.builder()
                .testcaseId(testcaseId)
                .inputPath("problems/prob-1/testcases/tc-1/input.txt")
                .outputPath("problems/prob-1/testcases/tc-1/output.txt")
                .build();

        Submission submission = Submission.builder()
                .submissionId(submissionId)
                .build();

        SubmissionResult result = SubmissionResult.builder()
                .submission(submission)
                .build();

        when(testcaseRepository.findByProblemProblemId(problemId)).thenReturn(List.of(testcase));
        when(submissionResultRepository.findByTestcaseTestcaseId(testcaseId)).thenReturn(List.of(result));

        // Act
        problemService.deleteProblem(problemId);

        // Assert
        // Verify S3 user output deletion
        String expectedUserOutputPath = String.format("submissions/%s/results/%s/output.txt", submissionId, testcaseId);
        verify(storageService).delete(expectedUserOutputPath);

        // Verify S3 testcase files deletion
        verify(storageService).delete("problems/prob-1/testcases/tc-1/input.txt");
        verify(storageService).delete("problems/prob-1/testcases/tc-1/output.txt");

        // Verify DB deletion calls
        verify(contestProblemRepository).deleteAllByProblemProblemId(problemId);
        verify(problemRepository).deleteById(problemId);
    }
}
