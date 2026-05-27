package com.example.app.service;

import com.example.app.dto.judge0.Judge0CallbackPayload;
import com.example.app.dto.judge0.Judge0Request;
import com.example.app.dto.judge0.Judge0Response;
import com.example.app.entity.Problem;
import com.example.app.entity.Testcase;
import com.example.app.repository.ProblemRepository;
import com.example.app.repository.TestcaseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.SetOperations;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.SimpleTransactionStatus;

import java.io.InputStream;
import java.util.*;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class OutputGeneratorAsyncTest {

    @Mock
    private Judge0Client judge0Client;

    @Mock
    private R2StorageService storageService;

    @Mock
    private ProblemRepository problemRepository;

    @Mock
    private TestcaseRepository testcaseRepository;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private SetOperations<String, String> setOperations;

    @Mock
    private NotificationService notificationService;

    @Mock
    private PlatformTransactionManager transactionManager;

    @InjectMocks
    private OutputGeneratorService outputGeneratorService;

    @BeforeEach
    void setUp() {
        outputGeneratorService.afterPropertiesSet();
        ReflectionTestUtils.setField(outputGeneratorService, "callbackUrl", "http://localhost:8080/api/internal/judge/callback");
    }

    @Test
    void testGenerateOutputsAsync_Success() {
        // Arrange
        UUID problemId = UUID.randomUUID();
        Problem problem = Problem.builder()
                .problemId(problemId)
                .solutionCode("code")
                .solutionLanguageId(54)
                .build();

        UUID tcId1 = UUID.randomUUID();
        Testcase tc1 = Testcase.builder().testcaseId(tcId1).inputPath("in1").outputPath("out1").build();
        List<Testcase> testcases = List.of(tc1);

        when(problemRepository.findById(problemId)).thenReturn(Optional.of(problem));
        when(testcaseRepository.findByProblemProblemId(problemId)).thenReturn(testcases);
        when(storageService.readAsString(anyString())).thenReturn("test-input");
        when(redisTemplate.opsForSet()).thenReturn(setOperations);

        // Act
        outputGeneratorService.generateOutputsAsync(problemId);

        // Assert
        verify(redisTemplate.opsForSet(), times(1)).add(eq("problem:" + problemId + ":pending-outputs"), any(String[].class));
        verify(judge0Client, times(1)).submitBatch(anyList());
    }

    @Test
    void testProcessOutputCallback_Success() {
        // Arrange
        UUID testcaseId = UUID.randomUUID();
        UUID problemId = UUID.randomUUID();
        
        com.example.app.entity.Users creator = com.example.app.entity.Users.builder()
                .userId(UUID.randomUUID())
                .build();
                
        Problem problem = Problem.builder()
                .problemId(problemId)
                .title("Problem Title")
                .problemCreator(creator)
                .build();
                
        Testcase tc = Testcase.builder()
                .testcaseId(testcaseId)
                .problem(problem)
                .build();

        Judge0CallbackPayload payload = new Judge0CallbackPayload();
        Judge0CallbackPayload.Judge0Status status = new Judge0CallbackPayload.Judge0Status();
        status.setId(3); // AC
        status.setDescription("Accepted");
        payload.setStatus(status);
        payload.setStdout("aGVsbG8="); // "hello" in base64

        when(testcaseRepository.findById(testcaseId)).thenReturn(Optional.of(tc));
        when(redisTemplate.opsForSet()).thenReturn(setOperations);
        when(setOperations.isMember(anyString(), anyString())).thenReturn(true);
        when(setOperations.size(anyString())).thenReturn(0L); // all completed
        when(problemRepository.findById(problemId)).thenReturn(Optional.of(problem));
        when(storageService.saveTestcaseOutput(any(), any(), any(), anyLong())).thenReturn("saved-output-path");

        // Act
        outputGeneratorService.processOutputCallback(testcaseId, payload);

        // Assert
        verify(setOperations, times(1)).remove(eq("problem:" + problemId + ":pending-outputs"), eq(testcaseId.toString()));
        verify(testcaseRepository, times(1)).save(any(Testcase.class));
        verify(notificationService, times(1)).sendToUsers(anyString(), anyString(), anyList());
        verify(redisTemplate, times(1)).delete(eq("problem:" + problemId + ":pending-outputs"));
    }
}
