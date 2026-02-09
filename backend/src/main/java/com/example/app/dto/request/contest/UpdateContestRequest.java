package com.example.app.dto.request.contest;

import lombok.Data;

import java.time.OffsetDateTime;

@Data
public class UpdateContestRequest {
    private String contestName;
    private OffsetDateTime startTime;
    private OffsetDateTime endTime;
    private Boolean isPublic;
}
