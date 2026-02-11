package com.example.app.dto.judge0;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class Judge0Request {
    @JsonProperty("language_id")
    private Integer languageId;

    @JsonProperty("source_code")
    private String sourceCode;

    @JsonProperty("stdin")
    private String stdin;

    @JsonProperty("expected_output")
    private String expectedOutput;

    @JsonProperty("cpu_time_limit")
    private Double cpuTimeLimit;

    @JsonProperty("memory_limit")
    private Integer memoryLimit;

    @JsonProperty("callback_url")
    private String callbackUrl;
}
