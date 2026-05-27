package com.example.app.service;

import com.example.app.dto.judge0.Judge0Request;
import com.example.app.dto.judge0.Judge0Response;
import com.example.app.dto.judge0.Judge0CallbackPayload;
import com.example.app.entity.Problem;
import com.example.app.entity.Testcase;
import com.example.app.exception.AppException;
import com.example.app.exception.ErrorCode;
import com.example.app.repository.ProblemRepository;
import com.example.app.repository.TestcaseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class OutputGeneratorService implements org.springframework.beans.factory.InitializingBean {
    private static final long POLL_TIMEOUT_MS = 300 * 1000L;
    private static final long POLL_INTERVAL_MS = 1500L;

    private final Judge0Client judge0Client;
    private final R2StorageService storageService;
    private final ProblemRepository problemRepository;
    private final TestcaseRepository testcaseRepository;
    private final StringRedisTemplate redisTemplate;
    private final NotificationService notificationService;
    private final org.springframework.transaction.PlatformTransactionManager transactionManager;
    private org.springframework.transaction.support.TransactionTemplate transactionTemplate;

    @Value("${judge0.callback-url}")
    private String callbackUrl;

    @Override
    public void afterPropertiesSet() {
        this.transactionTemplate = new org.springframework.transaction.support.TransactionTemplate(transactionManager);
    }

    public void generateOutputsAsync(UUID problemId) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new AppException(ErrorCode.PROBLEM_NOT_FOUND));

        if (problem.getSolutionCode() == null || problem.getSolutionLanguageId() == null) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }

        List<Testcase> testcases = testcaseRepository.findByProblemProblemId(problemId);
        if (testcases.isEmpty()) return;

        double cpuTimeLimit = problem.getTimeLimit() != null ? problem.getTimeLimit() : 10.0;
        double wallTimeLimit = cpuTimeLimit * 2;
        int memoryLimit = problem.getMemoryLimit() != null ? problem.getMemoryLimit() * 1024 : 256000;

        // Fetch inputs concurrently
        List<java.util.concurrent.CompletableFuture<String>> inputFutures = testcases.stream()
                .map(tc -> java.util.concurrent.CompletableFuture.supplyAsync(() -> storageService.readAsString(tc.getInputPath())))
                .toList();

        java.util.concurrent.CompletableFuture.allOf(inputFutures.toArray(new java.util.concurrent.CompletableFuture[0])).join();

        // Build all requests in one go
        List<Judge0Request> requests = new ArrayList<>();
        List<String> testcaseIds = new ArrayList<>();
        for (int i = 0; i < testcases.size(); i++) {
            Testcase tc = testcases.get(i);
            String input = inputFutures.get(i).join();
            String tcCallbackUrl = callbackUrl.replace("/callback", "/output-callback/" + tc.getTestcaseId().toString());

            requests.add(Judge0Request.builder()
                    .languageId(problem.getSolutionLanguageId())
                    .sourceCode(problem.getSolutionCode())
                    .stdin(input)
                    .cpuTimeLimit(cpuTimeLimit)
                    .wallTimeLimit(wallTimeLimit)
                    .memoryLimit(memoryLimit)
                    .callbackUrl(tcCallbackUrl)
                    .build());
            
            testcaseIds.add(tc.getTestcaseId().toString());
        }

        // Store active testcases to Redis set to track progress
        String redisKey = "problem:" + problemId + ":pending-outputs";
        redisTemplate.opsForSet().add(redisKey, testcaseIds.toArray(new String[0]));
        redisTemplate.expire(redisKey, 1, TimeUnit.HOURS);

        // Submit all at once — no blocking per testcase
        log.info("Submitting batch of {} testcases to Judge0 async for problem: {}", testcases.size(), problemId);
        judge0Client.submitBatch(requests);
    }

    @Transactional
    public void processOutputCallback(UUID testcaseId, Judge0CallbackPayload payload) {
        log.info("Processing output callback for testcase: {}", testcaseId);

        Testcase tc = testcaseRepository.findById(testcaseId)
                .orElseThrow(() -> new AppException(ErrorCode.TESTCASE_NOT_FOUND));
        
        UUID problemId = tc.getProblem().getProblemId();
        String redisKey = "problem:" + problemId + ":pending-outputs";

        // 1. Check if the testcase is still in the pending set (deduplication)
        Boolean isPending = redisTemplate.opsForSet().isMember(redisKey, testcaseId.toString());
        if (!Boolean.TRUE.equals(isPending)) {
            log.info("[CALLBACK] Testcase {} is not in the pending set. Ignoring duplicate or outdated callback.", testcaseId);
            return;
        }

        // 2. Remove the testcase from the pending set
        redisTemplate.opsForSet().remove(redisKey, testcaseId.toString());

        // 3. Check status
        if (payload.getStatus() == null || payload.getStatus().getId() != 3) {
            log.error("Solution failed for testcase {} output generation: status={}", testcaseId,
                    payload.getStatus() != null ? payload.getStatus().getDescription() : "null");
            // Check if this was the last testcase in the batch
            checkAndNotifyCompletion(problemId, redisKey);
            return;
        }

        // 4. Save stdout to Cloudflare R2
        String output = payload.getStdout() != null ? payload.getStdout() : "";
        byte[] outputBytes = output.getBytes(StandardCharsets.UTF_8);

        String outputPath = storageService.saveTestcaseOutput(
                problemId,
                testcaseId,
                new ByteArrayInputStream(outputBytes),
                outputBytes.length
        );

        // 5. Update Testcase metadata
        tc.setOutputPath(outputPath);
        tc.setOutputSizeKb((int) Math.ceil(outputBytes.length / 1024.0));
        testcaseRepository.save(tc);
        log.info("Successfully updated expected output for testcase: {}", testcaseId);

        // 6. Check if this was the last testcase in the batch
        checkAndNotifyCompletion(problemId, redisKey);
    }

    private void checkAndNotifyCompletion(UUID problemId, String redisKey) {
        Long remaining = redisTemplate.opsForSet().size(redisKey);
        if (remaining != null && remaining == 0) {
            log.info("All testcases completed for problem: {}. Triggering completion notification.", problemId);
            
            // Delete the key
            redisTemplate.delete(redisKey);

            // Fetch problem to notify the creator
            Problem problem = problemRepository.findById(problemId).orElse(null);
            if (problem != null && problem.getProblemCreator() != null) {
                try {
                    notificationService.sendToUsers(
                            "Sinh Output Hoàn Tất",
                            "Dữ liệu đầu ra mong muốn cho bài toán '" + problem.getTitle() + "' đã được tạo thành công.",
                            List.of(problem.getProblemCreator().getUserId())
                    );
                } catch (Exception e) {
                    log.error("Failed to send output generation completion notification for problem: {}", problemId, e);
                }
            }
        }
    }
}
