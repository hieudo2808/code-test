package com.example.app.controller;

import com.example.app.dto.ApiResponse;
import com.example.app.dto.response.SystemStatsResponse;
import com.example.app.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public ApiResponse<SystemStatsResponse> getSystemStats() {
        return ApiResponse.<SystemStatsResponse>builder()
                .result(adminService.getSystemStats())
                .build();
    }

    @GetMapping("/stats/submissions-weekly")
    public ApiResponse<List<Map<String, Object>>> getWeeklySubmissions() {
        return ApiResponse.<List<Map<String, Object>>>builder()
                .result(adminService.getWeeklySubmissions())
                .build();
    }

    @GetMapping("/stats/verdict-distribution")
    public ApiResponse<List<Map<String, Object>>> getVerdictDistribution() {
        return ApiResponse.<List<Map<String, Object>>>builder()
                .result(adminService.getVerdictDistribution())
                .build();
    }

    @GetMapping("/health")
    public ApiResponse<Map<String, String>> healthCheck() {
        return ApiResponse.<Map<String, String>>builder()
                .result(Map.of(
                        "status", "healthy",
                        "service", "CodeTrials Backend"
                ))
                .build();
    }
}
