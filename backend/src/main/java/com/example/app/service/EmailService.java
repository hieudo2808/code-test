package com.example.app.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender mailSender;

    @Async
    public void sendAccountCreatedEmail(String toEmail, String password) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Tài khoản của bạn đã được tạo - Code Trials");
            message.setText(buildAccountCreatedEmailContent(toEmail, password));
            
            mailSender.send(message);
            log.info("Account creation email sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", toEmail, e.getMessage());
        }
    }

    private String buildAccountCreatedEmailContent(String email, String password) {
        return """
            Xin chào,
            
            Tài khoản của bạn trên hệ thống Code Trials đã được tạo thành công.
            
            Thông tin đăng nhập:
            - Email: %s
            - Mật khẩu: %s
            
            Vui lòng đổi mật khẩu sau khi đăng nhập lần đầu.
            
            Trân trọng,
            Code Trials Team
            """.formatted(email, password);
    }
}
