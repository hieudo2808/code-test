package com.example.app.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class NotificationResponse {
    private UUID notificationId;
    private String title;
    private String message;
    private Boolean isRead;
    private OffsetDateTime createdAt;
}
