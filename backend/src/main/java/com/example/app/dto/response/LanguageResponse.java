package com.example.app.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LanguageResponse {
    private Integer id;
    private String name;
    private String extension;
    private String monacoLanguage;
}
