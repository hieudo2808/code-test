package com.example.app.dto.request.notification;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class CreateNotificationRequest {
    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(max = 200, message = "Tiêu đề không quá 200 ký tự")
    private String title;

    @NotBlank(message = "Nội dung không được để trống")
    private String message;

    /**
     * If null or empty, notification is sent to ALL users.
     * Otherwise, sent to specified emails only.
     */
    private List<String> targetEmails;
}
