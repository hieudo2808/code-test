package com.example.app.service;

import com.example.app.dto.response.InstructorStatsResponse;
import com.example.app.dto.response.ProblemStatsResponse;
import com.example.app.dto.response.UserStatsResponse;
import com.example.app.entity.Problem;
import com.example.app.entity.enums.Verdict;
import com.example.app.repository.ContestParticipantRepository;
import com.example.app.repository.ContestRepository;
import com.example.app.repository.ProblemRepository;
import com.example.app.repository.SubmissionRepository;
import com.example.app.security.SecurityHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final SubmissionRepository submissionRepository;
    private final ContestParticipantRepository participantRepository;
    private final ProblemRepository problemRepository;
    private final ContestRepository contestRepository;
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

    public InstructorStatsResponse getInstructorStats() {
        UUID userId = securityHelper.getCurrentUserId();

        long totalProblems = problemRepository.countByProblemCreatorUserId(userId);
        long totalContests = contestRepository.countByContestOwnerUserId(userId);

        // Count total participants across all instructor's contests
        var contests = contestRepository.findByContestOwnerUserId(userId, PageRequest.of(0, 1000));
        long totalParticipants = contests.getContent().stream()
                .mapToLong(c -> participantRepository.countByContestId(c.getContestId()))
                .sum();

        // Calculate avg acceptance rate across all instructor's problems
        var problems = problemRepository.findByProblemCreatorUserId(userId, PageRequest.of(0, 1000));
        List<Problem> problemList = problems.getContent();
        double avgAcceptanceRate = 0.0;
        if (!problemList.isEmpty()) {
            double totalRate = 0.0;
            int countWithSubmissions = 0;
            for (Problem p : problemList) {
                long total = submissionRepository.countByProblemProblemId(p.getProblemId());
                if (total > 0) {
                    long accepted = submissionRepository.countByProblemProblemIdAndFinalVerdict(p.getProblemId(), Verdict.ACCEPTED);
                    totalRate += (double) accepted / total;
                    countWithSubmissions++;
                }
            }
            if (countWithSubmissions > 0) {
                avgAcceptanceRate = Math.round((totalRate / countWithSubmissions) * 10000.0) / 100.0;
            }
        }

        return InstructorStatsResponse.builder()
                .totalProblems(totalProblems)
                .totalContests(totalContests)
                .totalParticipants(totalParticipants)
                .avgAcceptanceRate(avgAcceptanceRate)
                .build();
    }
}
