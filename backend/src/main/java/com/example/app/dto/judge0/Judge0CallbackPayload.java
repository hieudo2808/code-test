package com.example.app.dto.judge0;

import lombok.Data;

import java.util.Base64;

@Data
public class Judge0CallbackPayload {
    private String token;
    private String stdout;
    private String stderr;
    private String compile_output;
    private String message;
    private Judge0Status status;
    private Double time;
    private Integer memory;

    public String getStdout() {
        return decodeBase64(stdout);
    }

    public String getStderr() {
        return decodeBase64(stderr);
    }

    public String getCompile_output() {
        return decodeBase64(compile_output);
    }

    private static String decodeBase64(String value) {
        if (value == null || value.isEmpty()) return value;
        try {
            return new String(Base64.getDecoder().decode(value));
        } catch (IllegalArgumentException e) {
            // Not Base64 encoded, return as-is
            return value;
        }
    }

    @Data
    public static class Judge0Status {
        private Integer id;
        private String description;
    }
}
