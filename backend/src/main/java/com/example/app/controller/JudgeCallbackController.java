package com.example.app.controller;

import com.example.app.dto.judge0.Judge0CallbackPayload;
import com.example.app.service.submission.ResultProcessor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/internal/judge")
@RequiredArgsConstructor
public class JudgeCallbackController {
    private final ResultProcessor resultProcessor;

    @PutMapping("/callback")
    public ResponseEntity<Void> handleCallback(@RequestBody Judge0CallbackPayload payload) {
        log.debug("Received Judge0 callback for token: {}", payload.getToken());
        resultProcessor.processCallback(payload);
        return ResponseEntity.ok().build();
    }
}
