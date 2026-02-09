package com.example.app.entity.enums;

public enum SubmissionStatus {
    PENDING,       // Vừa submit
    COMPILING,     // Đang compile
    RUNNING,       // Đang chạy testcases
    EVALUATING,    // Đang tính điểm
    NEED_REVIEW,   // Chờ chấm manual
    DONE,          // Hoàn thành
    ERROR          // Lỗi hệ thống
}
