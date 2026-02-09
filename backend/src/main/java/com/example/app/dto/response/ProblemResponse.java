package com.example.app.dto.response;

import com.example.app.entity.enums.Difficulty;
import com.example.app.entity.enums.EvaluationType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProblemResponse {
    UUID problemId;
    String title;
    String slug;
    String problemDescription;
    EvaluationType evaluationType;
    Double timeLimit;
    Integer memoryLimit;
    Difficulty difficulty;
    String sampleInput;
    String sampleOutput;
    Boolean isPublic;
    Double maxScore;
    OffsetDateTime createAt;
    OffsetDateTime updateAt;
    
    // Creator info
    UUID creatorId;
    String creatorName;
    
    // Stats
    Integer testcaseCount;
}
