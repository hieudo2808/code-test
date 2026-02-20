package com.example.app.service.submission;

import com.example.app.dto.judge0.Judge0Request;
import com.example.app.entity.Problem;
import com.example.app.entity.Submission;
import com.example.app.entity.SubmissionResult;
import com.example.app.entity.Testcase;
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

/**
 * Dispatches EXACT-mode submissions to Judge0 via batch API.
 * Loads testcases from S3, builds batch requests, saves SubmissionResult records with tokens.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExactDispatcher {

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

            submission.setSubmissionStatus(SubmissionStatus.COMPILING);
            submissionRepository.save(submission);

            Problem problem = submission.getProblem();
            List<Testcase> testcases = testcaseRepository.findByProblemProblemId(problem.getProblemId());

            // Pre-fetch all testcase inputs from S3 in parallel
            List<CompletableFuture<String>> inputFutures = testcases.stream()
                    .map(tc -> CompletableFuture.supplyAsync(() -> readFromS3(tc.getInputPath())))
                    .toList();
            CompletableFuture.allOf(inputFutures.toArray(new CompletableFuture[0])).join();

            // Build all Judge0 requests
            Double cpuTimeLimit = problem.getTimeLimit() != null ? problem.getTimeLimit() : 5.0;
            Double wallTimeLimit = problem.getTimeLimit() != null ? problem.getTimeLimit() * 2 : 10.0;
            Integer memoryLimit = problem.getMemoryLimit() != null ? problem.getMemoryLimit() * 1024 : 256000;

            List<Judge0Request> batchRequests = new ArrayList<>();
            for (int i = 0; i < testcases.size(); i++) {
                String input = inputFutures.get(i).join();
                batchRequests.add(Judge0Request.builder()
                        .languageId(submission.getLanguageId())
                        .sourceCode(submission.getSourceCode())
                        .stdin(input)
                        .cpuTimeLimit(cpuTimeLimit)
                        .wallTimeLimit(wallTimeLimit)
                        .memoryLimit(memoryLimit)
                        .redirectStderrToStdout(true)
                        .build());
            }

            // Submit all at once via batch API
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
            log.error("ExactDispatcher failed for submission: {}", submission.getSubmissionId(), e);
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
