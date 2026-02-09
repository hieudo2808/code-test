package com.example.app.entity.enums;

public enum Verdict {
    ACCEPTED,       // Đúng 100%
    PARTIAL,        // Đúng một phần
    FAILED,         // Sai kết quả
    COMPILE_ERROR,  // Lỗi compile
    RUNTIME_ERROR,  // Lỗi runtime
    TIME_LIMIT,     // Quá thời gian
    MEMORY_LIMIT,   // Quá bộ nhớ
    SCORED,         // HEURISTIC: có điểm
    MANUAL          // Chấm thủ công
}
