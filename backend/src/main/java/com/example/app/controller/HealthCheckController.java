package com.example.app.controller;

import com.example.app.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/checkstatus")
@RequiredArgsConstructor
public class HealthCheckController {
    @GetMapping
    public ApiResponse<Void> checkHealth() {
        return ApiResponse.<Void>builder()
                .message("Service is up and running")
                .build();
    }
}
