package com.example.app.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "Notifications")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "notificationId")
    private UUID notificationId;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "notificationMessage", columnDefinition = "NVARCHAR(MAX)")
    private String message;

    @CreationTimestamp
    @Column(name = "createdAt")
    private OffsetDateTime createdAt;
}
