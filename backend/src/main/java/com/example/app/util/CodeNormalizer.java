package com.example.app.util;

import com.example.app.entity.Submission;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Slf4j
@Component
public class CodeNormalizer {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${plagiarism.worker.url:http://localhost:3000/api/tokenize/batch}")
    private String workerBatchUrl;

    /**
     * Normalize a single code string by wrapping it in a batch request to the Tree-sitter Node.js worker.
     * Throws exception if worker is down.
     */
    public String normalize(String code, int languageId) {
        if (code == null || code.isEmpty()) {
            return "";
        }

        Submission tempSub = Submission.builder()
                .submissionId(UUID.randomUUID())
                .sourceCode(code)
                .languageId(languageId)
                .build();

        Map<UUID, String> result = normalizeBatch(Collections.singletonList(tempSub));
        return result.getOrDefault(tempSub.getSubmissionId(), "");
    }

    /**
     * Batch Normalization for thousands of submissions simultaneously.
     */
    public Map<UUID, String> normalizeBatch(List<Submission> submissions) {
        if (submissions == null || submissions.isEmpty()) {
            return Collections.emptyMap();
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            List<Map<String, Object>> requests = new ArrayList<>();
            for (Submission sub : submissions) {
                if (sub.getSourceCode() == null || sub.getSourceCode().isEmpty()) continue;
                requests.add(Map.of(
                        "id", sub.getSubmissionId().toString(),
                        "code", sub.getSourceCode(),
                        "languageId", sub.getLanguageId()
                ));
            }

            String jsonRequest = objectMapper.writeValueAsString(requests);
            HttpEntity<String> entity = new HttpEntity<>(jsonRequest, headers);

            String response = restTemplate.postForObject(workerBatchUrl, entity, String.class);

            if (response != null) {
                return objectMapper.readValue(response, new TypeReference<>() {
                });
            }
        } catch (Exception e) {
            log.error("Plagiarism worker batch processing unavailable or failed: {}", e.getMessage());
            throw new RuntimeException("Plagiarism Worker Offline. Please check your docker containers.");
        }

        return Collections.emptyMap();
    }


}
