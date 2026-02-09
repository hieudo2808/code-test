package com.example.app.service;

import com.example.app.dto.response.SystemStatsResponse;
import com.example.app.entity.enums.SubmissionStatus;
import com.example.app.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final ProblemRepository problemRepository;
    private final SubmissionRepository submissionRepository;
    private final ContestRepository contestRepository;

    @PreAuthorize("hasAuthority('SYSTEM_CONFIG')")
    public SystemStatsResponse getSystemStats() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByIsActiveTrue();

        long totalProblems = problemRepository.count();
        long publicProblems = problemRepository.countByIsPublicTrue();

        long totalSubmissions = submissionRepository.count();
        long pendingSubmissions = submissionRepository.countBySubmissionStatus(SubmissionStatus.PENDING);

        long totalContests = contestRepository.count();
        long activeContests = contestRepository.findUpcomingAndRunning(OffsetDateTime.now()).size();

        return SystemStatsResponse.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .totalProblems(totalProblems)
                .publicProblems(publicProblems)
                .totalSubmissions(totalSubmissions)
                .pendingSubmissions(pendingSubmissions)
                .totalContests(totalContests)
                .activeContests(activeContests)
                .build();
    }
}
