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
    PASSWORD_INVALID(1013, "Invalid password", HttpStatus.BAD_REQUEST),

    SLUG_EXISTED(2001, "Slug already exists", HttpStatus.BAD_REQUEST),
    PROBLEM_NOT_FOUND(2002, "Problem not found", HttpStatus.NOT_FOUND),
    PROBLEM_HAS_SUBMISSIONS(2003, "Cannot delete problem with existing submissions", HttpStatus.CONFLICT),

    TESTCASE_NOT_FOUND(2101, "Testcase not found", HttpStatus.NOT_FOUND),
    TESTCASE_SCORE_EXCEEDED(2102, "Total testcase score exceeds max score", HttpStatus.BAD_REQUEST),

    SUBMISSION_NOT_FOUND(2201, "Submission not found", HttpStatus.NOT_FOUND),
    SUBMISSION_ALREADY_JUDGING(2202, "Submission is already being judged", HttpStatus.CONFLICT),

    JUDGE_SERVICE_ERROR(3001, "Judge service error", HttpStatus.INTERNAL_SERVER_ERROR),
    JUDGE_SERVICE_UNAVAILABLE(3002, "Judge service unavailable", HttpStatus.SERVICE_UNAVAILABLE),
    JUDGE_QUEUE_FULL(3003, "Judge queue is full, please try again later", HttpStatus.TOO_MANY_REQUESTS),

    CONTEST_NOT_FOUND(2301, "Contest not found", HttpStatus.NOT_FOUND),
    CONTEST_NOT_STARTED(2302, "Contest has not started yet", HttpStatus.BAD_REQUEST),
    CONTEST_ENDED(2303, "Contest has already ended", HttpStatus.BAD_REQUEST),
    CONTEST_NOT_JOINED(2304, "You have not joined this contest", HttpStatus.FORBIDDEN),
    CONTEST_ALREADY_JOINED(2305, "You have already joined this contest", HttpStatus.CONFLICT),
    CONTEST_SUBMISSION_LIMIT(2306, "Submission limit exceeded for this problem", HttpStatus.TOO_MANY_REQUESTS),
    PROBLEM_NOT_IN_CONTEST(2307, "Problem is not part of this contest", HttpStatus.BAD_REQUEST),
    CONTEST_JOIN_NOT_ALLOWED(2308, "Joining is not allowed after contest started", HttpStatus.FORBIDDEN),

    FORBIDDEN(4003, "Access denied", HttpStatus.FORBIDDEN),
    FILE_UPLOAD_FAILED(5001, "File upload failed", HttpStatus.INTERNAL_SERVER_ERROR);

    private final int code;
    private final String message;
    private final HttpStatus statusCode;

    ErrorCode(int code, String message, HttpStatus statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }
}