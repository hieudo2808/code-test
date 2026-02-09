package com.example.app.service;

import com.example.app.dto.response.NotificationResponse;
import com.example.app.entity.UserNotification;
import com.example.app.repository.UserNotificationRepository;
import com.example.app.security.SecurityHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final UserNotificationRepository userNotificationRepository;
    private final SecurityHelper securityHelper;

    public Page<NotificationResponse> getMyNotifications(Pageable pageable) {
        UUID userId = securityHelper.getCurrentUserId();
        return userNotificationRepository.findByUserId(userId, pageable)
                .map(this::toResponse);
    }

    public long getUnreadCount() {
        UUID userId = securityHelper.getCurrentUserId();
        return userNotificationRepository.countUnreadByUserId(userId);
    }

    @Transactional
    public void markAsRead(UUID notificationId) {
        UUID userId = securityHelper.getCurrentUserId();
        userNotificationRepository.markAsRead(userId, notificationId);
    }

    @Transactional
    public void markAllAsRead() {
        UUID userId = securityHelper.getCurrentUserId();
        userNotificationRepository.markAllAsRead(userId);
    }

    private NotificationResponse toResponse(UserNotification un) {
        return NotificationResponse.builder()
                .notificationId(un.getNotification().getNotificationId())
                .title(un.getNotification().getTitle())
                .message(un.getNotification().getMessage())
                .isRead(un.getIsRead())
                .createdAt(un.getNotification().getCreatedAt())
                .build();
    }
}
