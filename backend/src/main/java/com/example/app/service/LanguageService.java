package com.example.app.service;

import com.example.app.dto.response.LanguageResponse;
import com.example.app.entity.Language;
import com.example.app.repository.LanguageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LanguageService {
    private final LanguageRepository languageRepository;

    public List<LanguageResponse> getActiveLanguages() {
        return languageRepository.findByIsActiveTrueOrderByNameAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private LanguageResponse toResponse(Language language) {
        return LanguageResponse.builder()
                .id(language.getLanguageId())
                .name(language.getName())
                .extension(language.getExtension())
                .monacoLanguage(language.getMonacoLanguage())
                .build();
    }
}
