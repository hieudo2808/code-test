package com.example.app.service;

import com.example.app.dto.response.SystemStatsResponse;
import com.example.app.entity.enums.SubmissionStatus;
import com.example.app.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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

    @PreAuthorize("hasAuthority('SYSTEM_CONFIG')")
    public List<Map<String, Object>> getWeeklySubmissions() {
        OffsetDateTime since = OffsetDateTime.now().minusDays(7);
        List<Object[]> rows = submissionRepository.countSubmissionsPerDay(since);

        // Build a map for all 7 days
        Map<String, Long> dayMap = new LinkedHashMap<>();
        for (int i = 6; i >= 0; i--) {
            String day = OffsetDateTime.now().minusDays(i).toLocalDate().toString();
            dayMap.put(day, 0L);
        }

        for (Object[] row : rows) {
            String day = row[0].toString();
            long count = ((Number) row[1]).longValue();
            dayMap.put(day, count);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<String, Long> entry : dayMap.entrySet()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("date", entry.getKey());
            item.put("count", entry.getValue());
            result.add(item);
        }
        return result;
    }

    @PreAuthorize("hasAuthority('SYSTEM_CONFIG')")
    public List<Map<String, Object>> getVerdictDistribution() {
        List<Object[]> rows = submissionRepository.countByVerdict();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("verdict", row[0].toString());
            item.put("count", ((Number) row[1]).longValue());
            result.add(item);
        }
        return result;
    }
}
