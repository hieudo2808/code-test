package com.example.app.dto.request.notification;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class SendEmailRequest {
    @NotEmpty(message = "Danh sách email không được để trống")
    private List<String> toEmails;

    @NotBlank(message = "Tiêu đề không được để trống")
    private String subject;

    @NotBlank(message = "Nội dung không được để trống")
    private String body;
}
