package com.example.app.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Invalid message key", HttpStatus.BAD_REQUEST),
    USER_EXISTED(1002, "User existed", HttpStatus.BAD_REQUEST),
    USERNAME_INVALID(1003, "Username must be at least 3 characters", HttpStatus.BAD_REQUEST),
    EMAIL_NOT_FOUND(1004, "Email not found", HttpStatus.BAD_REQUEST),
    USER_NOT_FOUND(1005, "User not found", HttpStatus.NOT_FOUND),
    EMAIL_EXISTED(1006, "Email existed", HttpStatus.BAD_REQUEST),
    DEFAULT_ROLE_NOT_FOUND(1007, "Default role not found", HttpStatus.BAD_REQUEST),
    ACCOUNT_LOCKED(1008, "Account is locked", HttpStatus.BAD_REQUEST),
    INVALID_CREDENTIALS(1009, "Invalid credentials", HttpStatus.BAD_REQUEST),
    INVALID_TOKEN(1010, "Invalid token", HttpStatus.BAD_REQUEST),
    UNAUTHENTICATED(1011, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    RATE_LIMITED(1012, "Rate limited", HttpStatus.TOO_MANY_REQUESTS),
    PASSWORD_INVALID(1013, "Invalid password", HttpStatus.BAD_REQUEST);

    private final int code;
    private final String message;
    private final HttpStatus statusCode;

    ErrorCode(int code, String message, HttpStatus statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }
}