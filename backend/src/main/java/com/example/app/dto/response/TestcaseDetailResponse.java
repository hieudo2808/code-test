package com.example.app.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TestcaseDetailResponse {
    private String input;
    private String expectedOutput;
    private String actualOutput;
}
