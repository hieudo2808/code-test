package com.example.app.dto.judge0;

import lombok.Data;

@Data
public class Judge0Response {
    private String token;
    private String stdout;
    private String stderr;
    private String compile_output;
    private String message;
    private Judge0Status status;
    private Double time;
    private Integer memory;
    
    @Data
    public static class Judge0Status {
        private Integer id;
        private String description;
    }
}
