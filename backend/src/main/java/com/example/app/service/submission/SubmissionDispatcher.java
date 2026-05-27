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
import com.example.app.service.R2StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubmissionDispatcher implements InitializingBean {
    private static final int LANGUAGE_ID_C = 50;
    private static final int LANGUAGE_ID_CPP = 54;

    private final Judge0Client judge0Client;
    private final JudgeRateLimiter rateLimiter;
    private final R2StorageService storageService;
    private final SubmissionRepository submissionRepository;
    private final SubmissionResultRepository resultRepository;
    private final TestcaseRepository testcaseRepository;
    private final PlatformTransactionManager transactionManager;
    private TransactionTemplate transactionTemplate;

    @org.springframework.beans.factory.annotation.Qualifier("ioExecutor")
    private final java.util.concurrent.Executor ioExecutor;

    @Override
    public void afterPropertiesSet() {
        this.transactionTemplate = new TransactionTemplate(transactionManager);
        this.transactionTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    public void dispatch(Submission submission) {
        try {
            rateLimiter.acquire();

            Problem problem = submission.getProblem();

            // HEURISTIC requires a scorer
            if (problem.getEvaluationType() == EvaluationType.HEURISTIC) {
                if (problem.getScorerCode() == null || problem.getScorerLanguageId() == null) {
                    log.warn("No scorer configured for heuristic problem: {}", problem.getProblemId());
                    updateStatusInNewTx(submission.getSubmissionId(), SubmissionStatus.NEED_REVIEW);
                    return;
                }
            }

            updateStatusInNewTx(submission.getSubmissionId(), SubmissionStatus.COMPILING);

            List<Testcase> testcases = testcaseRepository.findByProblemProblemId(problem.getProblemId());

            List<CompletableFuture<String>> inputFutures = testcases.stream()
                    .map(tc -> CompletableFuture.supplyAsync(() -> storageService.readAsString(tc.getInputPath()), ioExecutor))
                    .toList();
            List<CompletableFuture<String>> expectedOutputFutures = testcases.stream()
                    .map(tc -> CompletableFuture.supplyAsync(() -> storageService.readAsString(tc.getOutputPath()), ioExecutor))
                    .toList();
            
            CompletableFuture.allOf(inputFutures.toArray(new CompletableFuture[0])).join();
            CompletableFuture.allOf(expectedOutputFutures.toArray(new CompletableFuture[0])).join();

            Double cpuTimeLimit = problem.getTimeLimit() != null ? problem.getTimeLimit() : 5.0;
            Double wallTimeLimit = Math.max(1.0, problem.getTimeLimit() != null ? problem.getTimeLimit() * 2 : 10.0);
            Integer memoryLimit = problem.getMemoryLimit() != null ? problem.getMemoryLimit() * 1024 : 256000;

            String compilerOptions = null;
            Integer langId = submission.getLanguageId();
            if (langId == LANGUAGE_ID_C || langId == LANGUAGE_ID_CPP) {
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
            final List<String> finalTokens = tokens;
            final List<Testcase> finalTestcases = testcases;
            transactionTemplate.executeWithoutResult(status -> {
                Submission sub = submissionRepository.findById(submission.getSubmissionId())
                        .orElseThrow(() -> new com.example.app.exception.AppException(com.example.app.exception.ErrorCode.SUBMISSION_NOT_FOUND));
                for (int i = 0; i < finalTestcases.size(); i++) {
                    SubmissionResult result = SubmissionResult.builder()
                            .submission(sub)
                            .testcase(finalTestcases.get(i))
                            .judge0Token(finalTokens.get(i))
                            .dispatchedAt(java.time.OffsetDateTime.now())
                            .build();
                    resultRepository.save(result);
                }
                sub.setSubmissionStatus(SubmissionStatus.RUNNING);
                submissionRepository.save(sub);
            });

        } catch (Exception e) {
            log.error("Dispatch failed for submission: {}", submission.getSubmissionId(), e);
            updateStatusInNewTx(submission.getSubmissionId(), SubmissionStatus.ERROR);
        } finally {
            rateLimiter.release();
        }
    }

    private void updateStatusInNewTx(java.util.UUID submissionId, SubmissionStatus status) {
        transactionTemplate.executeWithoutResult(txStatus -> {
            submissionRepository.findById(submissionId).ifPresent(s -> {
                s.setSubmissionStatus(status);
                submissionRepository.save(s);
            });
        });
    }


}
