package com.example.app.controller;

import com.example.app.dto.ApiResponse;
import com.example.app.service.SystemSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/admin/settings")
@RequiredArgsConstructor
public class SystemSettingsController {

    private final SystemSettingsService systemSettingsService;

    @GetMapping
    public ApiResponse<Map<String, String>> getAllSettings() {
        return ApiResponse.<Map<String, String>>builder()
                .message("Settings retrieved successfully")
                .result(systemSettingsService.getAllSettings())
                .build();
    }

    @GetMapping("/{key}")
    public ApiResponse<String> getSetting(@PathVariable String key) {
        return ApiResponse.<String>builder()
                .message("Setting retrieved successfully")
                .result(systemSettingsService.getSetting(key))
                .build();
    }

    @PutMapping
    public ApiResponse<Map<String, String>> updateSettings(@RequestBody Map<String, String> settings) {
        return ApiResponse.<Map<String, String>>builder()
                .message("Settings updated successfully")
                .result(systemSettingsService.updateSettings(settings))
                .build();
    }
}
