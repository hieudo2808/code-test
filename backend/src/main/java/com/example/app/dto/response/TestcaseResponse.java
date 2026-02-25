package com.example.app.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TestcaseResponse {
    UUID testcaseId;
    UUID problemId;
    Integer inputSizeKb;
    Integer outputSizeKb;
    Double testcasePoint;
    Boolean isHidden;
}
