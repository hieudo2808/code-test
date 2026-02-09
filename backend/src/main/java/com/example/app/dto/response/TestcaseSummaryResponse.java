package com.example.app.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TestcaseSummaryResponse {
    UUID testcaseId;
    Double testcasePoint;
    Boolean isHidden;
}
