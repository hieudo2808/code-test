package com.example.app.dto.request.submission;

import com.example.app.entity.enums.Verdict;
import lombok.Data;
import jakarta.validation.constraints.NotNull;

@Data
public class ManualGradeRequest {
    @NotNull(message = "Score is required")
    private Double score;
    @NotNull(message = "Verdict is required")
    private Verdict verdict;
}
