package com.example.app.controller;

import com.example.app.dto.ApiResponse;
import com.example.app.entity.SystemSettings;
import com.example.app.repository.SystemSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/maintenance")
@RequiredArgsConstructor
public class MaintenanceController {

    private final SystemSettingsRepository systemSettingsRepository;

    @GetMapping("/status")
    public ApiResponse<Map<String, Object>> getMaintenanceStatus() {
        boolean enabled = systemSettingsRepository.findById("maintenance.mode")
                .map(s -> "true".equalsIgnoreCase(s.getSettingValue()))
                .orElse(false);

        return ApiResponse.<Map<String, Object>>builder()
                .message("Maintenance status retrieved")
                .result(Map.of("maintenance", enabled))
                .build();
    }
}
