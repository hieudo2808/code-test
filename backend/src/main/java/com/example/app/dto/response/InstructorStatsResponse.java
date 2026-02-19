package com.example.app.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class InstructorStatsResponse {
    private long totalProblems;
    private long totalContests;
    private long totalParticipants;
    private double avgAcceptanceRate;
}
