package com.example.app.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProblemStatsResponse {
    private long totalSubmissions;
    private long acceptedSubmissions;
    private double acceptanceRate;
    private long uniqueSolvers;
}
