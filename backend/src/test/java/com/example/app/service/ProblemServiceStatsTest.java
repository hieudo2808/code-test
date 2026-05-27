package com.example.app.service;

import com.example.app.dto.response.ProblemSummaryResponse;
import com.example.app.entity.Problem;
import com.example.app.repository.ContestProblemRepository;
import com.example.app.repository.ProblemRepository;
import com.example.app.repository.SubmissionRepository;
import com.example.app.repository.UserRepository;
import com.example.app.mapper.ProblemMapper;
import com.example.app.security.SecurityHelper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.*;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ProblemServiceStatsTest {

    @Mock
    private ProblemRepository problemRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SubmissionRepository submissionRepository;

    @Mock
    private ContestProblemRepository contestProblemRepository;

    @Mock
    private ProblemMapper problemMapper;

    @Mock
    private SecurityHelper securityHelper;

    @InjectMocks
    private ProblemService problemService;

    @Test
    void testGetAllProblems_BatchFetchesStatsAndEnrichesResponses() {
        // Arrange
        UUID problemId1 = UUID.randomUUID();
        UUID problemId2 = UUID.randomUUID();

        Problem problem1 = Problem.builder().problemId(problemId1).isPublic(true).build();
        Problem problem2 = Problem.builder().problemId(problemId2).isPublic(true).build();
        List<Problem> problems = Arrays.asList(problem1, problem2);
        Page<Problem> problemsPage = new PageImpl<>(problems);

        ProblemSummaryResponse res1 = ProblemSummaryResponse.builder().problemId(problemId1).build();
        ProblemSummaryResponse res2 = ProblemSummaryResponse.builder().problemId(problemId2).build();

        when(securityHelper.hasAuthority("PROBLEM_CREATE")).thenReturn(true);
        when(problemRepository.findAll(any(Pageable.class))).thenReturn(problemsPage);
        when(problemMapper.toSummary(problem1)).thenReturn(res1);
        when(problemMapper.toSummary(problem2)).thenReturn(res2);

        // Mock batch statistics:
        // Problem 1: 10 total submissions, 5 accepted (50.0%)
        // Problem 2: 5 total submissions, 1 accepted (20.0%)
        List<Object[]> batchStats = new ArrayList<>();
        batchStats.add(new Object[]{problemId1, 10L, 5L});
        batchStats.add(new Object[]{problemId2, 5L, 1L});
        when(submissionRepository.countStatsForProblems(any())).thenReturn(batchStats);

        // Act
        Page<ProblemSummaryResponse> result = problemService.getAllProblems(PageRequest.of(0, 10));

        // Assert
        assertEquals(2, result.getContent().size());
        assertEquals(50.0, result.getContent().get(0).getAcceptanceRate());
        assertEquals(20.0, result.getContent().get(1).getAcceptanceRate());

        // Verify countStatsForProblems was called instead of individual counts
        verify(submissionRepository, times(1)).countStatsForProblems(any());
        verify(submissionRepository, never()).countByProblemProblemId(any());
        verify(submissionRepository, never()).countByProblemProblemIdAndFinalVerdict(any(), any());
    }
}
