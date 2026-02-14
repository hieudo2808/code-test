package com.example.app.service;

import com.example.app.dto.response.NotificationResponse;
import com.example.app.entity.Notification;
import com.example.app.entity.UserNotification;
import com.example.app.entity.UserNotificationId;
import com.example.app.entity.Users;
import com.example.app.repository.NotificationRepository;
import com.example.app.repository.UserNotificationRepository;
import com.example.app.repository.UserRepository;
import com.example.app.security.SecurityHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserNotificationRepository userNotificationRepository;
    private final UserRepository userRepository;
    private final SecurityHelper securityHelper;
    private final SimpMessagingTemplate messagingTemplate;
    private final JavaMailSender mailSender;

    // ==================== READ (existing) ====================

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

    // ==================== CREATE & BROADCAST ====================

    @Transactional
    public NotificationResponse sendToUsers(String title, String message, List<UUID> userIds) {
        Notification notification = Notification.builder()
                .title(title)
                .message(message)
                .build();
        notification = notificationRepository.save(notification);

        List<Users> users = userRepository.findAllById(userIds);
        for (Users user : users) {
            UserNotification un = UserNotification.builder()
                    .id(new UserNotificationId(user.getUserId(), notification.getNotificationId()))
                    .user(user)
                    .notification(notification)
                    .isRead(false)
                    .build();
            userNotificationRepository.save(un);

            NotificationResponse resp = toResponseFromEntity(notification, false);
            messagingTemplate.convertAndSendToUser(
                    user.getUserId().toString(),
                    "/queue/notifications",
                    resp
            );
        }

        return toResponseFromEntity(notification, false);
    }

    @Transactional
    public NotificationResponse sendToAll(String title, String message) {
        Notification notification = Notification.builder()
                .title(title)
                .message(message)
                .build();
        notification = notificationRepository.save(notification);

        List<Users> allUsers = userRepository.findAll();
        for (Users user : allUsers) {
            UserNotification un = UserNotification.builder()
                    .id(new UserNotificationId(user.getUserId(), notification.getNotificationId()))
                    .user(user)
                    .notification(notification)
                    .isRead(false)
                    .build();
            userNotificationRepository.save(un);

            messagingTemplate.convertAndSendToUser(
                    user.getUserId().toString(),
                    "/queue/notifications",
                    toResponseFromEntity(notification, false)
            );
        }

        return toResponseFromEntity(notification, false);
    }

    // ==================== EMAIL ====================

    public void sendEmail(List<String> toEmails, String subject, String body) {
        for (String email : toEmails) {
            try {
                SimpleMailMessage mailMessage = new SimpleMailMessage();
                mailMessage.setTo(email);
                mailMessage.setSubject(subject);
                mailMessage.setText(body);
                mailSender.send(mailMessage);
            } catch (Exception e) {
                log.error("Failed to send email to {}: {}", email, e.getMessage());
            }
        }
    }

    // ==================== HELPERS ====================

    private NotificationResponse toResponse(UserNotification un) {
        return NotificationResponse.builder()
                .notificationId(un.getNotification().getNotificationId())
                .title(un.getNotification().getTitle())
                .message(un.getNotification().getMessage())
                .isRead(un.getIsRead())
                .createdAt(un.getNotification().getCreatedAt())
                .build();
    }

    private NotificationResponse toResponseFromEntity(Notification n, boolean isRead) {
        return NotificationResponse.builder()
                .notificationId(n.getNotificationId())
                .title(n.getTitle())
                .message(n.getMessage())
                .isRead(isRead)
                .createdAt(n.getCreatedAt())
                .build();
    }
}
