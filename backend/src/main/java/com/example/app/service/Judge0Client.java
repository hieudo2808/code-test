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
    private static final long SYNC_POLL_INTERVAL_MS = 1000L;

    private final RestTemplate restTemplate;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @Value("${judge0.base-url}")
    private String baseUrl;

    @Value("${judge0.auth-token}")
    private String authToken;

    @Value("${judge0.callback-url}")
    private String callbackUrl;

    @Retryable(
            retryFor = {ResourceAccessException.class},
            maxAttempts = 3,
            backoff = @Backoff(delay = 2000, multiplier = 2)
    )
    public List<String> submitBatch(List<Judge0Request> requests) {
        if (requests.isEmpty()) return List.of();

        // Set callback URL for all requests if not already set
        requests.forEach(r -> {
            if (r.getCallbackUrl() == null) {
                r.setCallbackUrl(formatCallbackUrl(callbackUrl));
            } else {
                r.setCallbackUrl(formatCallbackUrl(r.getCallbackUrl()));
            }
        });

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Auth-Token", authToken);

        // Judge0 batch API expects {"submissions": [...]}
        String jsonBody;
        try {
            var wrapper = new java.util.HashMap<String, Object>();
            wrapper.put("submissions", requests);
            jsonBody = objectMapper.writeValueAsString(wrapper);
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
    public List<String> recoverSubmitBatch(ResourceAccessException e, List<Judge0Request> requests) {
        log.error("Judge0 batch submission failed after 3 retries (batch size={})", requests.size(), e);
        throw new AppException(ErrorCode.JUDGE_SERVICE_UNAVAILABLE);
    }

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
                Thread.sleep(SYNC_POLL_INTERVAL_MS);
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
                baseUrl + "/submissions/" + token + "?base64_encoded=false",
                HttpMethod.GET,
                entity,
                Judge0Response.class
        );

        return response.getBody();
    }

    public List<Judge0Response> getSubmissionsBatch(List<String> tokens) {
        if (tokens.isEmpty()) return List.of();

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Auth-Token", authToken);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        String tokensParam = String.join(",", tokens);
        String url = baseUrl + "/submissions/batch?tokens=" + tokensParam + "&base64_encoded=false";

        try {
            ResponseEntity<Judge0BatchResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    Judge0BatchResponse.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody().getSubmissions();
            }
            throw new AppException(ErrorCode.JUDGE_SERVICE_ERROR);
        } catch (Exception e) {
            log.error("Failed to fetch batch submissions from Judge0", e);
            throw new AppException(ErrorCode.JUDGE_SERVICE_ERROR);
        }
    }

    private String formatCallbackUrl(String url) {
        if (url == null) return null;
        if (url.startsWith("http://") || url.startsWith("https://")) {
            return url;
        }
        return "http://" + url;
    }

    @lombok.Data
    public static class Judge0BatchResponse {
        private List<Judge0Response> submissions;
    }
}
