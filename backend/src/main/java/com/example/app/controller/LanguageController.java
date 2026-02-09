package com.example.app.controller;

import com.example.app.dto.ApiResponse;
import com.example.app.dto.response.LanguageResponse;
import com.example.app.service.LanguageService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/languages")
@RequiredArgsConstructor
public class LanguageController {

    private final LanguageService languageService;

    @GetMapping
    public ApiResponse<List<LanguageResponse>> getLanguages() {
        return ApiResponse.<List<LanguageResponse>>builder()
                .result(languageService.getActiveLanguages())
                .build();
    }
}
