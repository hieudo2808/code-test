package com.example.app.dto.response;

import com.example.app.entity.enums.Difficulty;
import com.example.app.entity.enums.EvaluationType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProblemSummaryResponse {
    UUID problemId;
    String title;
    String slug;
    EvaluationType evaluationType;
    Difficulty difficulty;
    Boolean isPublic;
    Double maxScore;
    
    // Stats
    Integer testcaseCount;
    Double acceptanceRate;
}
