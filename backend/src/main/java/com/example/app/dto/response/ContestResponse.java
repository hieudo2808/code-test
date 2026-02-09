package com.example.app.dto.response;

import com.example.app.entity.enums.ContestState;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ContestResponse {
    private UUID contestId;
    private String contestName;
    private ContestState state;  // COMPUTED: UPCOMING, RUNNING, FINISHED
    
    private OffsetDateTime startTime;
    private OffsetDateTime endTime;
    
    private Boolean isPublic;
    
    private Integer problemCount;
    private Integer participantCount;
    private Boolean isJoined;  // Current user joined?
    
    private UUID ownerId;
    private String ownerName;
    
    private OffsetDateTime createdAt;
    
    // For detail response
    private List<ContestProblemResponse> problems;
}
