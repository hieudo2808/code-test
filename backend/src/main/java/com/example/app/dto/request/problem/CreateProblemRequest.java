package com.example.app.dto.request.problem;

import com.example.app.entity.enums.Difficulty;
import com.example.app.entity.enums.EvaluationType;
import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateProblemRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must not exceed 200 characters")
    String title;

    @NotBlank(message = "Slug is required")
    @Size(max = 250, message = "Slug must not exceed 250 characters")
    @Pattern(regexp = "^[a-z0-9-]+$", message = "Slug must contain only lowercase letters, numbers, and hyphens")
    String slug;

    String problemDescription;

    @NotNull(message = "Evaluation type is required")
    EvaluationType evaluationType;

    @DecimalMin(value = "0.1", message = "Time limit must be positive")
    Double timeLimit;

    @Min(value = 1, message = "Memory limit must be positive")
    Integer memoryLimit;

    Difficulty difficulty;

    String sampleInput;
    String sampleOutput;

    Boolean isPublic;

    @DecimalMin(value = "0.1", message = "Max score must be positive")
    Double maxScore;

    // For auto-generate output
    String solutionCode;
    Integer solutionLanguageId;

    // For heuristic judging
    String scorerCode;
    Integer scorerLanguageId;
}
