package com.example.app.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.util.UUID;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserNotificationId implements Serializable {
    private UUID userId;
    private UUID notificationId;
}
