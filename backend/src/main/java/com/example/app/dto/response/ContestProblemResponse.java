package com.example.app.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class ContestProblemResponse {
    private UUID problemId;
    private String title;
    private String slug;
    private String difficulty;
    private Double maxScore;
    private Integer maxSubmissions;  // null = unlimited
    private Integer userSubmissions; // How many user submitted
}
