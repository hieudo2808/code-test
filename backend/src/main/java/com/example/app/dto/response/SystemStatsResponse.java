package com.example.app.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SystemStatsResponse {
    private long totalUsers;
    private long activeUsers;
    private long totalProblems;
    private long publicProblems;
    private long totalSubmissions;
    private long pendingSubmissions;
    private long totalContests;
    private long activeContests;
}
