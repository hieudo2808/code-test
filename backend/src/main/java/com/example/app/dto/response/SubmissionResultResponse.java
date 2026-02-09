package com.example.app.dto.response;

import com.example.app.entity.enums.Verdict;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class SubmissionResultResponse {
    private UUID testcaseId;
    private Integer testcaseIndex;
    private Verdict verdict;
    private Double timeMs;
    private Double memoryKb;
    private Double score;
    private Double maxScore;
    private String errorMessage;  // Only visible to owner/admin
    private Boolean isHidden;
}
