package com.example.app.service;

import com.example.app.dto.response.ProblemStatsResponse;
import com.example.app.dto.response.UserStatsResponse;
import com.example.app.entity.enums.Verdict;
import com.example.app.repository.ContestParticipantRepository;
import com.example.app.repository.SubmissionRepository;
import com.example.app.security.SecurityHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final SubmissionRepository submissionRepository;
    private final ContestParticipantRepository participantRepository;
    private final SecurityHelper securityHelper;

    public UserStatsResponse getMyStats() {
        return getUserStats(securityHelper.getCurrentUserId());
    }

    public UserStatsResponse getUserStats(UUID userId) {
        long totalSubmissions = submissionRepository.countBySubmitterUserId(userId);
        long acceptedCount = submissionRepository.countBySubmitterUserIdAndFinalVerdict(userId, Verdict.ACCEPTED);
        long solvedProblems = submissionRepository.countDistinctAcceptedProblemsByUser(userId);
        long contestsJoined = participantRepository.countByParticipantUserId(userId);

        double acceptanceRate = totalSubmissions > 0 
                ? (double) acceptedCount / totalSubmissions 
                : 0.0;

        return UserStatsResponse.builder()
                .totalSubmissions(totalSubmissions)
                .acceptedCount(acceptedCount)
                .acceptanceRate(Math.round(acceptanceRate * 100.0) / 100.0)
                .solvedProblems(solvedProblems)
                .contestsJoined(contestsJoined)
                .build();
    }

    public ProblemStatsResponse getProblemStats(UUID problemId) {
        long totalSubmissions = submissionRepository.countByProblemProblemId(problemId);
        long acceptedSubmissions = submissionRepository.countByProblemProblemIdAndFinalVerdict(problemId, Verdict.ACCEPTED);
        long uniqueSolvers = submissionRepository.countDistinctSolversByProblem(problemId);

        double acceptanceRate = totalSubmissions > 0 
                ? (double) acceptedSubmissions / totalSubmissions 
                : 0.0;

        return ProblemStatsResponse.builder()
                .totalSubmissions(totalSubmissions)
                .acceptedSubmissions(acceptedSubmissions)
                .acceptanceRate(Math.round(acceptanceRate * 100.0) / 100.0)
                .uniqueSolvers(uniqueSolvers)
                .build();
    }
}
