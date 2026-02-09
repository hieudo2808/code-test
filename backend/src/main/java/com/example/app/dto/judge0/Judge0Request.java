package com.example.app.dto.judge0;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class Judge0Request {
    private Integer language_id;
    private String source_code;
    private String stdin;
    private String expected_output;
    private Double cpu_time_limit;
    private Integer memory_limit;
    private String callback_url;
}
