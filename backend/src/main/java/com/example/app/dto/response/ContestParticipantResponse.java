package com.example.app.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class ContestParticipantResponse {
    private UUID participantId;
    private String fullName;
    private OffsetDateTime joinedAt;
}
