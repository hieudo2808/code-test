package com.example.app.controller;

import com.example.app.dto.judge0.Judge0CallbackPayload;
import com.example.app.service.OutputGeneratorService;
import com.example.app.service.submission.ResultProcessor;
import com.example.app.service.submission.ScorerResultProcessor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/internal/judge")
@RequiredArgsConstructor
public class JudgeCallbackController {
    private final ResultProcessor resultProcessor;
    private final OutputGeneratorService outputGeneratorService;
    private final ScorerResultProcessor scorerResultProcessor;

    @PutMapping("/callback")
    public ResponseEntity<Void> handleCallback(@RequestBody Judge0CallbackPayload payload) {
        log.debug("Received Judge0 callback for token: {}", payload.getToken());
        resultProcessor.processCallback(payload);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/output-callback/{testcaseId}")
    public ResponseEntity<Void> handleOutputCallback(
            @PathVariable UUID testcaseId,
            @RequestBody Judge0CallbackPayload payload
    ) {
        log.info("Received Judge0 expected output callback for testcaseId: {}", testcaseId);
        outputGeneratorService.processOutputCallback(testcaseId, payload);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/scorer-callback/{submissionResultId}")
    public ResponseEntity<Void> handleScorerCallback(
            @PathVariable UUID submissionResultId,
            @RequestBody Judge0CallbackPayload payload
    ) {
        log.info("Received Judge0 scorer callback for submissionResultId: {}", submissionResultId);
        scorerResultProcessor.processCallback(submissionResultId, payload);
        return ResponseEntity.ok().build();
    }
}
