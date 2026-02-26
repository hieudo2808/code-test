package com.example.app.service.submission;

import com.example.app.dto.judge0.Judge0Request;
import com.example.app.entity.Problem;
import com.example.app.entity.Submission;
import com.example.app.entity.SubmissionResult;
import com.example.app.entity.Testcase;
import com.example.app.entity.enums.EvaluationType;
import com.example.app.entity.enums.SubmissionStatus;
import com.example.app.repository.SubmissionRepository;
import com.example.app.repository.SubmissionResultRepository;
import com.example.app.repository.TestcaseRepository;
import com.example.app.service.Judge0Client;
import com.example.app.service.JudgeRateLimiter;
import com.example.app.service.S3StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubmissionDispatcher {

    private final Judge0Client judge0Client;
    private final JudgeRateLimiter rateLimiter;
    private final S3StorageService storageService;
    private final SubmissionRepository submissionRepository;
    private final SubmissionResultRepository resultRepository;
    private final TestcaseRepository testcaseRepository;

    @Transactional
    public void dispatch(Submission submission) {
        try {
            rateLimiter.acquire();

            Problem problem = submission.getProblem();

            // HEURISTIC requires a scorer
            if (problem.getEvaluationType() == EvaluationType.HEURISTIC) {
                if (problem.getScorerCode() == null || problem.getScorerLanguageId() == null) {
                    log.warn("No scorer configured for heuristic problem: {}", problem.getProblemId());
                    submission.setSubmissionStatus(SubmissionStatus.NEED_REVIEW);
                    submissionRepository.save(submission);
                    return;
                }
            }

            submission.setSubmissionStatus(SubmissionStatus.COMPILING);
            submissionRepository.save(submission);

            List<Testcase> testcases = testcaseRepository.findByProblemProblemId(problem.getProblemId());

            List<CompletableFuture<String>> inputFutures = testcases.stream()
                    .map(tc -> CompletableFuture.supplyAsync(() -> readFromS3(tc.getInputPath())))
                    .toList();
            List<CompletableFuture<String>> expectedOutputFutures = testcases.stream()
                    .map(tc -> CompletableFuture.supplyAsync(() -> readFromS3(tc.getOutputPath())))
                    .toList();
            
            CompletableFuture.allOf(inputFutures.toArray(new CompletableFuture[0])).join();
            CompletableFuture.allOf(expectedOutputFutures.toArray(new CompletableFuture[0])).join();

            Double cpuTimeLimit = problem.getTimeLimit() != null ? problem.getTimeLimit() : 5.0;
            Double wallTimeLimit = Math.max(1.0, problem.getTimeLimit() != null ? problem.getTimeLimit() * 2 : 10.0);
            Integer memoryLimit = problem.getMemoryLimit() != null ? problem.getMemoryLimit() * 1024 : 256000;

            String compilerOptions = null;
            Integer langId = submission.getLanguageId();
            if (langId == 50 || langId == 54) {
                compilerOptions = "-O2 -Wall -Wextra -Werror=return-type -Werror=uninitialized -Werror=array-bounds -lm -fstack-protector-strong -fsanitize=address -fsanitize=undefined -fno-omit-frame-pointer";
            }

            List<Judge0Request> batchRequests = new ArrayList<>();
            for (int i = 0; i < testcases.size(); i++) {
                String input = inputFutures.get(i).join();
                String expectedOutput = expectedOutputFutures.get(i).join();

                log.info("[DISPATCHER] Testcase {}: input length={}, expectedOutput length={}",
                        testcases.get(i).getTestcaseId(), input.length(), expectedOutput.length());
                log.info("[DISPATCHER] expectedOutput snippet: '{}'", expectedOutput.substring(0, Math.min(50, expectedOutput.length())));

                batchRequests.add(Judge0Request.builder()
                        .languageId(submission.getLanguageId())
                        .sourceCode(submission.getSourceCode())
                        .stdin(input)
                        .expectedOutput(expectedOutput)
                        .cpuTimeLimit(cpuTimeLimit)
                        .wallTimeLimit(wallTimeLimit)
                        .memoryLimit(memoryLimit)
                        .redirectStderrToStdout(true)
                        .compilerOptions(compilerOptions)
                        .build());
            }

            // Submit via batch API
            List<String> tokens = judge0Client.submitBatch(batchRequests);

            // Save pending results with tokens
            for (int i = 0; i < testcases.size(); i++) {
                SubmissionResult result = SubmissionResult.builder()
                        .submission(submission)
                        .testcase(testcases.get(i))
                        .judge0Token(tokens.get(i))
                        .build();
                resultRepository.save(result);
            }

            submission.setSubmissionStatus(SubmissionStatus.RUNNING);
            submissionRepository.save(submission);

        } catch (Exception e) {
            log.error("Dispatch failed for submission: {}", submission.getSubmissionId(), e);
            submission.setSubmissionStatus(SubmissionStatus.ERROR);
            submissionRepository.save(submission);
        } finally {
            rateLimiter.release();
        }
    }

    private String readFromS3(String path) {
        try {
            byte[] bytes = storageService.getFile(path).readAllBytes();
            return new String(bytes);
        } catch (Exception e) {
            log.error("Failed to read testcase input from: {}", path, e);
            return "";
        }
    }
}
