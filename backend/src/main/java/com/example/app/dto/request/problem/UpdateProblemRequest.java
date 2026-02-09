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
public class UpdateProblemRequest {

    @Size(max = 200, message = "Title must not exceed 200 characters")
    String title;

    // Slug không cho update để giữ URL stable
    
    String problemDescription;

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
}
