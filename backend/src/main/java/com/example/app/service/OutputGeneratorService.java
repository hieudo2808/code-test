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
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class OutputGeneratorService {

    private final Judge0Client judge0Client;
    private final StorageService storageService;
    private final ProblemRepository problemRepository;
    private final TestcaseRepository testcaseRepository;

    /**
     * Generate expected outputs for all testcases of a problem by running the solution code.
     * This is used when instructor provides inputs + solution code instead of inputs + outputs.
     */
    @Transactional
    public int generateOutputs(UUID problemId) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new AppException(ErrorCode.PROBLEM_NOT_FOUND));

        if (problem.getSolutionCode() == null || problem.getSolutionLanguageId() == null) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }

        List<Testcase> testcases = testcaseRepository.findByProblemProblemId(problemId);
        int generatedCount = 0;

        for (Testcase tc : testcases) {
            try {
                // Read input
                String input = readFile(tc.getInputPath());

                // Run solution code
                Judge0Request request = Judge0Request.builder()
                        .languageId(problem.getSolutionLanguageId())
                        .sourceCode(problem.getSolutionCode())
                        .stdin(input)
                        .cpuTimeLimit(problem.getTimeLimit() != null ? problem.getTimeLimit() : 10.0)
                        .memoryLimit(problem.getMemoryLimit() != null ? problem.getMemoryLimit() * 1024 : 256000)
                        .build();

                Judge0Response response = judge0Client.submitSync(request, 60);

                // Check if solution ran successfully
                if (response.getStatus() == null || response.getStatus().getId() != 3) {
                    log.error("Solution failed for testcase {}: status={}", 
                            tc.getTestcaseId(), 
                            response.getStatus() != null ? response.getStatus().getDescription() : "unknown");
                    continue;
                }

                String output = response.getStdout() != null ? response.getStdout() : "";

                // Save output to storage using saveTestcaseOutput
                byte[] outputBytes = output.getBytes(StandardCharsets.UTF_8);
                String outputPath = storageService.saveTestcaseOutput(
                        problem.getProblemId(),
                        tc.getTestcaseId(),
                        new ByteArrayInputStream(outputBytes),
                        outputBytes.length
                );

                // Update testcase with new output path and size
                tc.setOutputPath(outputPath);
                tc.setOutputSizeKb((int) Math.ceil(outputBytes.length / 1024.0));
                testcaseRepository.save(tc);

                generatedCount++;
                log.info("Generated output for testcase: {}", tc.getTestcaseId());

            } catch (Exception e) {
                log.error("Failed to generate output for testcase: {}", tc.getTestcaseId(), e);
            }
        }

        log.info("Generated {} outputs for problem: {}", generatedCount, problemId);
        return generatedCount;
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

