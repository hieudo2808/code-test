package com.example.app.controller;

import com.example.app.dto.ApiResponse;
import com.example.app.dto.request.notification.CreateNotificationRequest;
import com.example.app.dto.request.notification.SendEmailRequest;
import com.example.app.dto.response.NotificationResponse;
import com.example.app.entity.Users;
import com.example.app.repository.UserRepository;
import com.example.app.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    // ==================== USER ENDPOINTS ====================

    @GetMapping
    public ApiResponse<Page<NotificationResponse>> getMyNotifications(
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.<Page<NotificationResponse>>builder()
                .result(notificationService.getMyNotifications(pageable))
                .build();
    }

    @GetMapping("/unread-count")
    public ApiResponse<Map<String, Long>> getUnreadCount() {
        return ApiResponse.<Map<String, Long>>builder()
                .result(Map.of("count", notificationService.getUnreadCount()))
                .build();
    }

    @PostMapping("/{notificationId}/read")
    public ApiResponse<Void> markAsRead(@PathVariable UUID notificationId) {
        notificationService.markAsRead(notificationId);
        return ApiResponse.<Void>builder()
                .message("Marked as read")
                .build();
    }

    @PostMapping("/mark-all-read")
    public ApiResponse<Void> markAllAsRead() {
        notificationService.markAllAsRead();
        return ApiResponse.<Void>builder()
                .message("All notifications marked as read")
                .build();
    }

    // ==================== ADMIN ENDPOINTS ====================

    @PostMapping("/send")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    public ApiResponse<NotificationResponse> sendNotification(
            @Valid @RequestBody CreateNotificationRequest request) {

        NotificationResponse response;

        if (request.getTargetEmails() == null || request.getTargetEmails().isEmpty()) {
            response = notificationService.sendToAll(request.getTitle(), request.getMessage());
        } else {
            List<UUID> userIds = request.getTargetEmails().stream()
                    .map(email -> userRepository.findByEmail(email)
                            .map(Users::getUserId)
                            .orElse(null))
                    .filter(id -> id != null)
                    .toList();

            response = notificationService.sendToUsers(
                    request.getTitle(), request.getMessage(), userIds);
        }

        return ApiResponse.<NotificationResponse>builder()
                .message("Gửi thông báo thành công")
                .result(response)
                .build();
    }

    @PostMapping("/send-email")
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    public ApiResponse<Void> sendEmail(@Valid @RequestBody SendEmailRequest request) {
        notificationService.sendEmail(
                request.getToEmails(), request.getSubject(), request.getBody());

        return ApiResponse.<Void>builder()
                .message("Email đã được gửi thành công")
                .build();
    }
}
