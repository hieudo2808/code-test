package com.example.app.dto.response;

import com.example.app.entity.enums.SubmissionStatus;
import com.example.app.entity.enums.Verdict;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SubmissionResponse {
    private UUID submissionId;
    private UUID problemId;
    private String problemTitle;
    private String problemSlug;
    private UUID contestId;          // Optional - for contest submissions
    
    // Status & Verdict
    private SubmissionStatus status;      // Luôn có
    private Verdict verdict;              // Chỉ khi status = DONE
    private String message;               // Khi CE/RTE/Error
    
    // Scoring
    private Double score;
    private Double maxScore;
    
    // Timing
    private OffsetDateTime submittedAt;
    private OffsetDateTime finishedAt;    // Khi DONE
    
    // Metadata
    private UUID submitterId;
    private String submitterName;
    private Integer languageId;
    
    // Detail fields (only in single submission view)
    private String sourceCode;
    private Double totalTimeMs;
    
    // Detail results (optional)
    private List<SubmissionResultResponse> results;
}

