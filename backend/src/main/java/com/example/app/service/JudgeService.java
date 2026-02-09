package com.example.app.service;

import com.example.app.dto.judge0.Judge0CallbackPayload;
import com.example.app.dto.judge0.Judge0Request;
import com.example.app.dto.judge0.Judge0Response;
import com.example.app.entity.Problem;
import com.example.app.entity.Submission;
import com.example.app.entity.SubmissionResult;
import com.example.app.entity.Testcase;
import com.example.app.entity.enums.SubmissionStatus;
import com.example.app.entity.enums.Verdict;
import com.example.app.exception.AppException;
import com.example.app.exception.ErrorCode;
import com.example.app.repository.SubmissionRepository;
import com.example.app.repository.SubmissionResultRepository;
import com.example.app.repository.TestcaseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class JudgeService {

    private final Judge0Client judge0Client;
    private final JudgeRateLimiter rateLimiter;
    private final StorageService storageService;
    private final SubmissionRepository submissionRepository;
    private final SubmissionResultRepository resultRepository;
    private final TestcaseRepository testcaseRepository;

    @Async("judgeExecutor")
    public void judgeExact(Submission submission) {
        try {
            rateLimiter.acquire();
            
            submission.setSubmissionStatus(SubmissionStatus.COMPILING);
            submissionRepository.save(submission);

            Problem problem = submission.getProblem();
            List<Testcase> testcases = testcaseRepository.findByProblemProblemId(problem.getProblemId());

            for (Testcase tc : testcases) {
                // Read input from S3
                String input = readTestcaseInput(tc.getInputPath());

                Judge0Request req = Judge0Request.builder()
                        .language_id(submission.getLanguageId())
                        .source_code(submission.getSourceCode())
                        .stdin(input)
                        .cpu_time_limit(problem.getTimeLimit() != null ? problem.getTimeLimit() / 1000.0 : 5.0)
                        .memory_limit(problem.getMemoryLimit() != null ? problem.getMemoryLimit() * 1024 : 256000)
                        .build();

                String token = judge0Client.submit(req);

                // Save pending result with token
                SubmissionResult result = SubmissionResult.builder()
                        .submission(submission)
                        .testcase(tc)
                        .judge0Token(token)
                        .build();
                resultRepository.save(result);
            }

            submission.setSubmissionStatus(SubmissionStatus.RUNNING);
            submissionRepository.save(submission);

        } catch (Exception e) {
            log.error("Judge exact failed for submission: {}", submission.getSubmissionId(), e);
            submission.setSubmissionStatus(SubmissionStatus.ERROR);
            submissionRepository.save(submission);
        } finally {
            rateLimiter.release();
        }
    }

    @Async("judgeExecutor")
    public void judgeHeuristic(Submission submission) {
        try {
            rateLimiter.acquire();
            
            submission.setSubmissionStatus(SubmissionStatus.COMPILING);
            submissionRepository.save(submission);

            Problem problem = submission.getProblem();
            
            // Validate scorer exists
            if (problem.getScorerCode() == null || problem.getScorerLanguageId() == null) {
                log.warn("No scorer configured for heuristic problem: {}", problem.getProblemId());
                markForManualReview(submission);
                return;
            }

            List<Testcase> testcases = testcaseRepository.findByProblemProblemId(problem.getProblemId());

            submission.setSubmissionStatus(SubmissionStatus.RUNNING);
            submissionRepository.save(submission);

            for (Testcase tc : testcases) {
                // Step 1: Run user code to get output
                String input = readTestcaseInput(tc.getInputPath());
                
                Judge0Request userReq = Judge0Request.builder()
                        .language_id(submission.getLanguageId())
                        .source_code(submission.getSourceCode())
                        .stdin(input)
                        .cpu_time_limit(problem.getTimeLimit() != null ? problem.getTimeLimit() / 1000.0 : 5.0)
                        .memory_limit(problem.getMemoryLimit() != null ? problem.getMemoryLimit() * 1024 : 256000)
                        .build();

                Judge0Response userResult = judge0Client.submitSync(userReq, 30);
                
                // Check if user code ran successfully
                if (userResult.getStatus() == null || userResult.getStatus().getId() != 3) {
                    // Runtime error or other failure
                    SubmissionResult result = SubmissionResult.builder()
                            .submission(submission)
                            .testcase(tc)
                            .verdict(mapVerdict(userResult.getStatus() != null ? userResult.getStatus().getId() : null))
                            .score(0.0)
                            .timeMs(userResult.getTime() != null ? userResult.getTime() * 1000 : null)
                            .memoryKb(userResult.getMemory() != null ? userResult.getMemory().doubleValue() : null)
                            .errorMessage(truncate(userResult.getStderr(), 500))
                            .build();
                    resultRepository.save(result);
                    continue;
                }

                String userOutput = userResult.getStdout() != null ? userResult.getStdout() : "";
                String expectedOutput = readTestcaseOutput(tc.getOutputPath());

                // Step 2: Run scorer with (input, userOutput, expectedOutput)
                String scorerInput = input + "\n---SEPARATOR---\n" + userOutput + "\n---SEPARATOR---\n" + expectedOutput;
                
                Judge0Request scorerReq = Judge0Request.builder()
                        .language_id(problem.getScorerLanguageId())
                        .source_code(problem.getScorerCode())
                        .stdin(scorerInput)
                        .cpu_time_limit(10.0) // Scorer gets more time
                        .memory_limit(256000)
                        .build();

                Judge0Response scorerResult = judge0Client.submitSync(scorerReq, 30);

                // Step 3: Parse scorer output
                double score = 0.0;
                String message = "Scorer error";
                Verdict verdict = Verdict.FAILED;

                if (scorerResult.getStatus() != null && scorerResult.getStatus().getId() == 3 && scorerResult.getStdout() != null) {
                    String[] lines = scorerResult.getStdout().split("\n");
                    for (String line : lines) {
                        if (line.startsWith("score:")) {
                            score = Double.parseDouble(line.substring(6).trim());
                        } else if (line.startsWith("message:")) {
                            message = line.substring(8).trim();
                        }
                    }
                    
                    if (score >= 1.0) {
                        verdict = Verdict.ACCEPTED;
                    } else if (score > 0) {
                        verdict = Verdict.PARTIAL;
                    } else {
                        verdict = Verdict.FAILED;
                    }
                }

                // Save result
                SubmissionResult result = SubmissionResult.builder()
                        .submission(submission)
                        .testcase(tc)
                        .verdict(verdict)
                        .score(score * tc.getTestcasePoint())
                        .timeMs(userResult.getTime() != null ? userResult.getTime() * 1000 : null)
                        .memoryKb(userResult.getMemory() != null ? userResult.getMemory().doubleValue() : null)
                        .errorMessage(message)
                        .build();
                resultRepository.save(result);
            }

            // Aggregate results
            aggregateIfComplete(submission.getSubmissionId());

        } catch (Exception e) {
            log.error("Judge heuristic failed for submission: {}", submission.getSubmissionId(), e);
            submission.setSubmissionStatus(SubmissionStatus.ERROR);
            submissionRepository.save(submission);
        } finally {
            rateLimiter.release();
        }
    }

    public void markForManualReview(Submission submission) {
        submission.setSubmissionStatus(SubmissionStatus.NEED_REVIEW);
        submissionRepository.save(submission);
        log.info("Marked submission {} for manual review", submission.getSubmissionId());
    }

    @Transactional
    public void handleCallback(Judge0CallbackPayload payload) {
        SubmissionResult result = resultRepository.findByJudge0Token(payload.getToken())
                .orElseThrow(() -> {
                    log.warn("Unknown Judge0 token: {}", payload.getToken());
                    return new AppException(ErrorCode.SUBMISSION_NOT_FOUND);
                });

        // Map Judge0 status to verdict
        Verdict verdict = mapVerdict(payload.getStatus().getId());
        result.setVerdict(verdict);
        result.setTimeMs(payload.getTime() != null ? payload.getTime() * 1000 : null);
        result.setMemoryKb(payload.getMemory() != null ? payload.getMemory().doubleValue() : null);

        // Set error message for non-accepted verdicts
        if (verdict != Verdict.ACCEPTED) {
            String errorMsg = payload.getCompile_output();
            if (errorMsg == null) errorMsg = payload.getStderr();
            if (errorMsg == null) errorMsg = payload.getMessage();
            result.setErrorMessage(truncate(errorMsg, 500));
        }

        // Set score based on verdict
        if (verdict == Verdict.ACCEPTED) {
            result.setScore(result.getTestcase().getTestcasePoint());
        } else {
            result.setScore(0.0);
        }

        resultRepository.save(result);
        log.debug("Processed callback for token: {}, verdict: {}", payload.getToken(), verdict);

        // Check if all testcases done
        aggregateIfComplete(result.getSubmission().getSubmissionId());
    }

    private void aggregateIfComplete(UUID submissionId) {
        long pending = resultRepository.countPendingBySubmissionId(submissionId);
        if (pending > 0) return;

        Submission submission = submissionRepository.findById(submissionId).orElse(null);
        if (submission == null) return;

        List<SubmissionResult> results = resultRepository.findBySubmissionSubmissionId(submissionId);

        // Calculate final score
        double totalScore = results.stream()
                .mapToDouble(r -> r.getScore() != null ? r.getScore() : 0)
                .sum();

        // Determine worst verdict (highest priority = worst)
        Verdict worstVerdict = results.stream()
                .map(SubmissionResult::getVerdict)
                .filter(v -> v != null)
                .max(Comparator.comparingInt(this::verdictPriority))
                .orElse(Verdict.ACCEPTED);

        // Calculate timing
        double totalTime = results.stream()
                .mapToDouble(r -> r.getTimeMs() != null ? r.getTimeMs() : 0)
                .sum();
        double peakMemory = results.stream()
                .mapToDouble(r -> r.getMemoryKb() != null ? r.getMemoryKb() : 0)
                .max().orElse(0);

        submission.setFinalScore(totalScore);
        submission.setFinalVerdict(worstVerdict);
        submission.setTotalTimeMs(totalTime);
        submission.setPeakMemoryKb(peakMemory);
        submission.setSubmissionStatus(SubmissionStatus.DONE);
        submissionRepository.save(submission);

        log.info("Submission {} completed: verdict={}, score={}", submissionId, worstVerdict, totalScore);
    }

    private Verdict mapVerdict(Integer statusId) {
        if (statusId == null) return Verdict.RUNTIME_ERROR;
        return switch (statusId) {
            case 1, 2 -> null; // In Queue / Processing
            case 3 -> Verdict.ACCEPTED;
            case 4 -> Verdict.FAILED; // Wrong Answer
            case 5 -> Verdict.TIME_LIMIT;
            case 6 -> Verdict.COMPILE_ERROR;
            case 7, 8, 9, 10, 11, 12 -> Verdict.RUNTIME_ERROR;
            default -> Verdict.RUNTIME_ERROR;
        };
    }

    private int verdictPriority(Verdict v) {
        return switch (v) {
            case ACCEPTED -> 0;
            case PARTIAL -> 1;
            case SCORED -> 1;
            case FAILED -> 2;
            case TIME_LIMIT -> 3;
            case MEMORY_LIMIT -> 3;
            case RUNTIME_ERROR -> 4;
            case COMPILE_ERROR -> 5;
            case MANUAL -> 6;
        };
    }

    private String readTestcaseInput(String path) {
        try {
            byte[] bytes = storageService.getFile(path).readAllBytes();
            return new String(bytes);
        } catch (Exception e) {
            log.error("Failed to read testcase input from: {}", path, e);
            return "";
        }
    }

    private String readTestcaseOutput(String path) {
        try {
            byte[] bytes = storageService.getFile(path).readAllBytes();
            return new String(bytes);
        } catch (Exception e) {
            log.error("Failed to read testcase output from: {}", path, e);
            return "";
        }
    }

    private String truncate(String s, int maxLen) {
        if (s == null) return null;
        return s.length() > maxLen ? s.substring(0, maxLen) : s;
    }
}
