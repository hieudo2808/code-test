package com.example.app.service;

import com.example.app.entity.SystemSettings;
import com.example.app.exception.AppException;
import com.example.app.exception.ErrorCode;
import com.example.app.repository.SystemSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class SystemSettingsService {
    private final SystemSettingsRepository systemSettingsRepository;

    @PreAuthorize("hasAuthority('SYSTEM_CONFIG')")
    public Map<String, String> getAllSettings() {
        Map<String, String> settings = new LinkedHashMap<>();
        systemSettingsRepository.findAll().forEach(s ->
                settings.put(s.getSettingKey(), s.getSettingValue()));
        return settings;
    }

    @PreAuthorize("hasAuthority('SYSTEM_CONFIG')")
    public String getSetting(String key) {
        return getSettingInternal(key);
    }

    public String getSettingInternal(String key) {
        return systemSettingsRepository.findById(key)
                .map(SystemSettings::getSettingValue)
                .orElseThrow(() -> new AppException(ErrorCode.SETTING_NOT_FOUND));
    }

    public String getSettingInternal(String key, String defaultValue) {
        return systemSettingsRepository.findById(key)
                .map(SystemSettings::getSettingValue)
                .orElse(defaultValue);
    }

    public int getSettingAsInt(String key, int defaultValue) {
        try {
            return Integer.parseInt(getSettingInternal(key, String.valueOf(defaultValue)));
        } catch (NumberFormatException e) {
            log.warn("Invalid integer for setting {}: fall back to default {}", key, defaultValue);
            return defaultValue;
        }
    }

    public double getSettingAsDouble(String key, double defaultValue) {
        try {
            return Double.parseDouble(getSettingInternal(key, String.valueOf(defaultValue)));
        } catch (NumberFormatException e) {
            log.warn("Invalid double for setting {}: fall back to default {}", key, defaultValue);
            return defaultValue;
        }
    }

    @Transactional
    @PreAuthorize("hasAuthority('SYSTEM_CONFIG')")
    public Map<String, String> updateSettings(Map<String, String> settings) {
        Map<String, String> updated = new LinkedHashMap<>();
        settings.forEach((key, value) -> {
            SystemSettings setting = systemSettingsRepository.findById(key)
                    .orElseThrow(() -> new AppException(ErrorCode.SETTING_NOT_FOUND));
            setting.setSettingValue(value);
            systemSettingsRepository.save(setting);
            updated.put(key, value);
            log.info("Setting updated: {} = {}", key, value);
        });
        return updated;
    }
}
