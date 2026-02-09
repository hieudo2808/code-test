package com.example.app.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class PlagiarismResultResponse {
    private UUID checkId;
    private UUID problemId;
    private String problemTitle;
    
    private UUID submission1Id;
    private UUID submission2Id;
    
    private UUID user1Id;
    private String user1Name;
    
    private UUID user2Id;
    private String user2Name;
    
    private Double similarity;
    private OffsetDateTime checkedAt;
}
