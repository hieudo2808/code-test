package com.example.app.service;

import com.example.app.dto.judge0.Judge0Request;
import com.example.app.dto.judge0.Judge0Response;
import com.example.app.exception.AppException;
import com.example.app.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Recover;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
public class Judge0Client {

    private final RestTemplate restTemplate;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @Value("${judge0.base-url}")
    private String baseUrl;

    @Value("${judge0.auth-token}")
    private String authToken;

    @Value("${judge0.callback-url}")
    private String callbackUrl;

    @Retryable(
            retryFor = {ResourceAccessException.class, AppException.class},
            maxAttempts = 3,
            backoff = @Backoff(delay = 2000, multiplier = 2)
    )
    public String submit(Judge0Request request) {
        request.setCallbackUrl(callbackUrl);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Auth-Token", authToken);

        String jsonBody;
        try {
            jsonBody = objectMapper.writeValueAsString(request);
            log.info("Sending to Judge0: {}", jsonBody);
        } catch (Exception e) {
            log.error("Failed to serialize request", e);
            throw new AppException(ErrorCode.JUDGE_SERVICE_ERROR);
        }

        HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);

        try {
            ResponseEntity<Judge0Response> response = restTemplate.exchange(
                    baseUrl + "/submissions",
                    HttpMethod.POST,
                    entity,
                    Judge0Response.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String token = response.getBody().getToken();
                log.debug("Submitted to Judge0, token: {}", token);
                return token;
            }

            throw new AppException(ErrorCode.JUDGE_SERVICE_ERROR);

        } catch (ResourceAccessException e) {
            log.warn("Judge0 connection error: {}", e.getMessage());
            throw e;
        }
    }

    /**
     * Submit code and wait for result synchronously.
     * Used for heuristic judging where we need output before running scorer.
     */
    public Judge0Response submitSync(Judge0Request request, int maxWaitSeconds) {
        // Don't use callback for sync submission
        request.setCallbackUrl(null);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Auth-Token", authToken);

        String jsonBody;
        try {
            jsonBody = objectMapper.writeValueAsString(request);
        } catch (Exception e) {
            throw new AppException(ErrorCode.JUDGE_SERVICE_ERROR);
        }

        HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);

        // Submit with wait=true parameter
        ResponseEntity<Judge0Response> response = restTemplate.exchange(
                baseUrl + "/submissions?wait=true",
                HttpMethod.POST,
                entity,
                Judge0Response.class
        );

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            return response.getBody();
        }

        throw new AppException(ErrorCode.JUDGE_SERVICE_ERROR);
    }

    public Judge0Response getSubmission(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Auth-Token", authToken);

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<Judge0Response> response = restTemplate.exchange(
                baseUrl + "/submissions/" + token,
                HttpMethod.GET,
                entity,
                Judge0Response.class
        );

        return response.getBody();
    }

    @Recover
    public String recoverSubmit(Exception e, Judge0Request request) {
        log.error("Judge0 submit failed after all retries", e);
        throw new AppException(ErrorCode.JUDGE_SERVICE_UNAVAILABLE);
    }
}
