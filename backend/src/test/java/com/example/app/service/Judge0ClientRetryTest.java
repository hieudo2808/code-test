package com.example.app.service;

import com.example.app.dto.judge0.Judge0Request;
import com.example.app.exception.AppException;
import com.example.app.exception.ErrorCode;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@SpringBootTest
public class Judge0ClientRetryTest {

    @Autowired
    private Judge0Client judge0Client;

    @MockitoBean
    private RestTemplate restTemplate;

    @Test
    void testSubmitBatch_RetriesAndRecovers() {
        // Arrange
        Judge0Request request = Judge0Request.builder().stdin("input").build();
        List<Judge0Request> requests = List.of(request);

        when(restTemplate.exchange(
                any(String.class),
                any(),
                any(),
                any(org.springframework.core.ParameterizedTypeReference.class)
        )).thenThrow(new ResourceAccessException("Connection timed out"));

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () -> {
            judge0Client.submitBatch(requests);
        });

        assertEquals(ErrorCode.JUDGE_SERVICE_UNAVAILABLE, exception.getErrorCode());

        // Verify that exchange was called exactly 3 times (due to 3 attempts config)
        verify(restTemplate, times(3)).exchange(
                any(String.class),
                any(),
                any(),
                any(org.springframework.core.ParameterizedTypeReference.class)
        );
    }
}
