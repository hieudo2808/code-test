package com.example.app.dto.request.submission;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class SubmitCodeRequest {

    @NotNull(message = "Problem ID is required")
    private UUID problemId;

    private UUID contestId;

    @NotNull(message = "Language ID is required")
    private Integer languageId;

    @NotBlank(message = "Source code cannot be empty")
    private String sourceCode;
}
