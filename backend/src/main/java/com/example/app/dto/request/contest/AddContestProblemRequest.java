package com.example.app.dto.request.contest;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class AddContestProblemRequest {

    @NotNull(message = "Problem ID is required")
    private UUID problemId;

    private Integer maxSubmissions;  // null = unlimited
}
