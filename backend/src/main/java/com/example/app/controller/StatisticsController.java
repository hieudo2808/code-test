package com.example.app.controller;

import com.example.app.dto.ApiResponse;
import com.example.app.dto.response.ProblemStatsResponse;
import com.example.app.dto.response.UserStatsResponse;
import com.example.app.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/stats")
@RequiredArgsConstructor
public class StatisticsController {

    private final StatisticsService statisticsService;

    @GetMapping("/me")
    public ApiResponse<UserStatsResponse> getMyStats() {
        return ApiResponse.<UserStatsResponse>builder()
                .result(statisticsService.getMyStats())
                .build();
    }

    @GetMapping("/users/{userId}")
    public ApiResponse<UserStatsResponse> getUserStats(@PathVariable UUID userId) {
        return ApiResponse.<UserStatsResponse>builder()
                .result(statisticsService.getUserStats(userId))
                .build();
    }

    @GetMapping("/problems/{problemId}")
    public ApiResponse<ProblemStatsResponse> getProblemStats(@PathVariable UUID problemId) {
        return ApiResponse.<ProblemStatsResponse>builder()
                .result(statisticsService.getProblemStats(problemId))
                .build();
    }
}
