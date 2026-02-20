package com.example.app.service;

import com.example.app.dto.judge0.Judge0Request;
import com.example.app.dto.judge0.Judge0Response;
import com.example.app.exception.AppException;
import com.example.app.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Recover;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.List;

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
        request.setCallbackUrl("http://" + callbackUrl);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Auth-Token", authToken);

        String jsonBody;
        try {
            jsonBody = objectMapper.writeValueAsString(request);
            log.info("Judge0 submit: language_id={}, cpu_time_limit={}, wall_time_limit={}, memory_limit={}, redirect_stderr={}",
                    request.getLanguageId(), request.getCpuTimeLimit(), request.getWallTimeLimit(),
                    request.getMemoryLimit(), request.getRedirectStderrToStdout());
        } catch (Exception e) {
            log.error("Failed to serialize request", e);
            throw new AppException(ErrorCode.JUDGE_SERVICE_ERROR);
        }

        HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);

        try {
            ResponseEntity<Judge0Response> response = restTemplate.exchange(
                    baseUrl + "/submissions?base64_encoded=false",
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
     * Submit multiple submissions in a single HTTP call using Judge0 batch API.
     * Judge0 compiles the source code once and reuses it for all submissions in the batch.
     * Returns a list of tokens in the same order as the input requests.
     */
    @Retryable(
            retryFor = {ResourceAccessException.class, AppException.class},
            maxAttempts = 3,
            backoff = @Backoff(delay = 2000, multiplier = 2)
    )
    public List<String> submitBatch(List<Judge0Request> requests) {
        if (requests.isEmpty()) return List.of();

        // Set callback URL for all requests
        requests.forEach(r -> r.setCallbackUrl("http://" + callbackUrl));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Auth-Token", authToken);

        // Judge0 batch API expects {"submissions": [...]}
        String jsonBody;
        try {
            var wrapper = new java.util.HashMap<String, Object>();
            wrapper.put("submissions", requests);
            jsonBody = objectMapper.writeValueAsString(wrapper);

            Judge0Request first = requests.get(0);
            log.info("Judge0 batch submit: {} submissions, language_id={}, cpu_time_limit={}, wall_time_limit={}, memory_limit={}",
                    requests.size(), first.getLanguageId(), first.getCpuTimeLimit(),
                    first.getWallTimeLimit(), first.getMemoryLimit());
        } catch (Exception e) {
            log.error("Failed to serialize batch request", e);
            throw new AppException(ErrorCode.JUDGE_SERVICE_ERROR);
        }

        HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);

        try {
            ResponseEntity<List<Judge0Response>> response = restTemplate.exchange(
                    baseUrl + "/submissions/batch?base64_encoded=false",
                    HttpMethod.POST,
                    entity,
                    new ParameterizedTypeReference<List<Judge0Response>>() {}
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<String> tokens = response.getBody().stream()
                        .map(Judge0Response::getToken)
                        .toList();
                log.debug("Batch submitted to Judge0, {} tokens received", tokens.size());
                return tokens;
            }

            throw new AppException(ErrorCode.JUDGE_SERVICE_ERROR);

        } catch (ResourceAccessException e) {
            log.warn("Judge0 batch connection error: {}", e.getMessage());
            throw e;
        }
    }

    @Recover
    public List<String> recoverSubmitBatch(Exception e, List<Judge0Request> requests) {
        log.error("Judge0 batch submit failed after all retries", e);
        throw new AppException(ErrorCode.JUDGE_SERVICE_UNAVAILABLE);
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
                baseUrl + "/submissions?base64_encoded=false&wait=true",
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
                baseUrl + "/submissions/" + token + "?base64_encoded=false",
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
