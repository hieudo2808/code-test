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
        request.setCallbackUrl(callbackUrl);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Auth-Token", authToken);

        String jsonBody;
        try {
            jsonBody = objectMapper.writeValueAsString(request);
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
     * Submit code and wait for result synchronously using submit + poll.
     * Used for heuristic judging where we need the output before scoring.
     *
     * Judge0's wait=true is unreliable on some setups (returns 201 with null fields),
     * so we submit normally, then poll GET /submissions/{token} until complete.
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
            log.error("[SUBMIT_SYNC] Failed to serialize request", e);
            throw new AppException(ErrorCode.JUDGE_SERVICE_ERROR);
        }

        HttpEntity<String> entity = new HttpEntity<>(jsonBody, headers);

        // Step 1: Submit (without wait=true)
        ResponseEntity<Judge0Response> submitResponse = restTemplate.exchange(
                baseUrl + "/submissions?base64_encoded=false",
                HttpMethod.POST,
                entity,
                Judge0Response.class
        );

        if (!submitResponse.getStatusCode().is2xxSuccessful()
                || submitResponse.getBody() == null
                || submitResponse.getBody().getToken() == null) {
            log.error("[SUBMIT_SYNC] Submit failed: status={}", submitResponse.getStatusCode());
            throw new AppException(ErrorCode.JUDGE_SERVICE_ERROR);
        }

        String token = submitResponse.getBody().getToken();

        // Step 2: Poll until done or timeout
        long deadline = System.currentTimeMillis() + (maxWaitSeconds * 1000L);
        int pollCount = 0;

        while (System.currentTimeMillis() < deadline) {
            try {
                Thread.sleep(1000); // poll every 1 second
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new AppException(ErrorCode.JUDGE_SERVICE_ERROR);
            }

            pollCount++;
            Judge0Response result = getSubmission(token);

            if (result == null || result.getStatus() == null) {
                log.debug("[SUBMIT_SYNC] Poll #{}: no status yet for token={}", pollCount, token);
                continue;
            }

            int statusId = result.getStatus().getId();

            // statusId 1 = In Queue, 2 = Processing → keep polling
            if (statusId <= 2) {
                continue;
            }

            return result;
        }

        log.error("[SUBMIT_SYNC] Timeout after {}s polling token={} ({} polls)", maxWaitSeconds, token, pollCount);
        throw new AppException(ErrorCode.JUDGE_SERVICE_ERROR);
    }

    public Judge0Response getSubmission(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Auth-Token", authToken);

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<Judge0Response> response = restTemplate.exchange(
                baseUrl + "/submissions/" + token + "?base64_encoded=true",
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
