package com.example.app.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private UUID userId;
    private String fullName;
    private String email;
    private String avatarUrl;
    private String bio;
    private String roleName;
    private OffsetDateTime createdAt;
    private boolean isActive;
}
