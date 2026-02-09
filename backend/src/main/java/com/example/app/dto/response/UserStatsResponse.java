package com.example.app.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserStatsResponse {
    private long totalSubmissions;
    private long acceptedCount;
    private double acceptanceRate;
    private long solvedProblems;
    private long contestsJoined;
}
