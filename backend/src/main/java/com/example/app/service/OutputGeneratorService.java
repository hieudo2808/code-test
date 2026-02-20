package com.example.app.service;

import com.example.app.dto.judge0.Judge0Request;
import com.example.app.dto.judge0.Judge0Response;
import com.example.app.entity.Problem;
import com.example.app.entity.Testcase;
import com.example.app.exception.AppException;
import com.example.app.exception.ErrorCode;
import com.example.app.repository.ProblemRepository;
import com.example.app.repository.TestcaseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class OutputGeneratorService {

    private final Judge0Client judge0Client;
    private final S3StorageService storageService;
    private final ProblemRepository problemRepository;
    private final TestcaseRepository testcaseRepository;

    /**
     * Generate expected outputs for all testcases by running the solution code.
     * Uses batch submit + polling instead of sequential submitSync to avoid blocking.
     */
    @Transactional
    public int generateOutputs(UUID problemId) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new AppException(ErrorCode.PROBLEM_NOT_FOUND));

        if (problem.getSolutionCode() == null || problem.getSolutionLanguageId() == null) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }

        List<Testcase> testcases = testcaseRepository.findByProblemProblemId(problemId);
        if (testcases.isEmpty()) return 0;

        double cpuTimeLimit = problem.getTimeLimit() != null ? problem.getTimeLimit() : 10.0;
        double wallTimeLimit = cpuTimeLimit * 2;
        int memoryLimit = problem.getMemoryLimit() != null ? problem.getMemoryLimit() * 1024 : 256000;

        // Build all requests in one go
        List<Judge0Request> requests = new ArrayList<>();
        for (Testcase tc : testcases) {
            String input = readFile(tc.getInputPath());
            requests.add(Judge0Request.builder()
                    .languageId(problem.getSolutionLanguageId())
                    .sourceCode(problem.getSolutionCode())
                    .stdin(input)
                    .cpuTimeLimit(cpuTimeLimit)
                    .wallTimeLimit(wallTimeLimit)
                    .memoryLimit(memoryLimit)
                    .build());
        }

        // Submit all at once — no blocking per testcase
        log.info("Submitting batch of {} testcases to Judge0 for problem: {}", testcases.size(), problemId);
        List<String> tokens = judge0Client.submitBatch(requests);

        // Poll until all are done (max 300 seconds — Judge0 can be slow under load)
        List<Judge0Response> results = pollUntilDone(tokens, 300);

        // Save outputs
        int generatedCount = 0;
        for (int i = 0; i < testcases.size(); i++) {
            Testcase tc = testcases.get(i);
            Judge0Response response = i < results.size() ? results.get(i) : null;

            if (response == null || response.getStatus() == null || response.getStatus().getId() != 3) {
                log.error("Solution failed for testcase {}: status={}", tc.getTestcaseId(),
                        response != null && response.getStatus() != null
                                ? response.getStatus().getDescription() : "null/timeout");
                continue;
            }

            String output = response.getStdout() != null ? response.getStdout() : "";
            byte[] outputBytes = output.getBytes(StandardCharsets.UTF_8);

            String outputPath = storageService.saveTestcaseOutput(
                    problem.getProblemId(),
                    tc.getTestcaseId(),
                    new ByteArrayInputStream(outputBytes),
                    outputBytes.length
            );

            tc.setOutputPath(outputPath);
            tc.setOutputSizeKb((int) Math.ceil(outputBytes.length / 1024.0));
            testcaseRepository.save(tc);

            generatedCount++;
            log.info("Generated output for testcase: {}", tc.getTestcaseId());
        }

        log.info("Generated {}/{} outputs for problem: {}", generatedCount, testcases.size(), problemId);
        return generatedCount;
    }

    /**
     * Poll Judge0 for all tokens until all are done or timeout expires.
     */
    private List<Judge0Response> pollUntilDone(List<String> tokens, int maxSeconds) {
        List<Judge0Response> results = new ArrayList<>();
        for (int i = 0; i < tokens.size(); i++) results.add(null);

        boolean[] done = new boolean[tokens.size()];
        int pending = tokens.size();
        long deadline = System.currentTimeMillis() + maxSeconds * 1000L;

        while (pending > 0 && System.currentTimeMillis() < deadline) {
            try {
                Thread.sleep(1500);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }

            for (int i = 0; i < tokens.size(); i++) {
                if (done[i]) continue;
                try {
                    Judge0Response resp = judge0Client.getSubmission(tokens.get(i));
                    // status id > 2 means finished (3=AC, 4=WA, 5=TLE, 6=CE, ...)
                    if (resp != null && resp.getStatus() != null && resp.getStatus().getId() > 2) {
                        results.set(i, resp);
                        done[i] = true;
                        pending--;
                    }
                } catch (Exception e) {
                    log.warn("Failed to poll token {}: {}", tokens.get(i), e.getMessage());
                }
            }
        }

        if (pending > 0) {
            log.warn("{}/{} testcases timed out after {}s", pending, tokens.size(), maxSeconds);
        }

        return results;
    }

    private String readFile(String path) {
        try {
            byte[] bytes = storageService.getFile(path).readAllBytes();
            return new String(bytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("Failed to read file: {}", path, e);
            return "";
        }
    }
}
