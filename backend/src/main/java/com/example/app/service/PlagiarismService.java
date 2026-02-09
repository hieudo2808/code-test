package com.example.app.service;

import com.example.app.dto.response.PlagiarismResultResponse;
import com.example.app.entity.PlagiarismCheck;
import com.example.app.entity.Submission;
import com.example.app.entity.enums.Verdict;
import com.example.app.exception.AppException;
import com.example.app.exception.ErrorCode;
import com.example.app.repository.ContestRepository;
import com.example.app.repository.PlagiarismCheckRepository;
import com.example.app.repository.SubmissionRepository;
import com.example.app.util.CodeNormalizer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlagiarismService {

    private static final double THRESHOLD = 0.75;

    private final PlagiarismCheckRepository plagiarismRepository;
    private final SubmissionRepository submissionRepository;
    private final ContestRepository contestRepository;
    private final CodeNormalizer codeNormalizer;

    /**
     * Trigger plagiarism check for a contest.
     * Runs asynchronously in background.
     */
    @Async("judgeExecutor")
    @Transactional
    @PreAuthorize("hasAuthority('SUBMISSION_READ_ALL')")
    public void runPlagiarismCheck(UUID contestId) {
        log.info("Starting plagiarism check for contest: {}", contestId);

        if (!contestRepository.existsById(contestId)) {
            throw new AppException(ErrorCode.CONTEST_NOT_FOUND);
        }

        // Load all valid submissions for contest
        List<Submission> submissions = submissionRepository.findByContestContestId(contestId, null)
                .getContent()
                .stream()
                .filter(s -> s.getFinalVerdict() != Verdict.COMPILE_ERROR)
                .toList();

        log.info("Found {} valid submissions for plagiarism check", submissions.size());

        // Group by problem
        Map<UUID, List<Submission>> byProblem = submissions.stream()
                .collect(Collectors.groupingBy(s -> s.getProblem().getProblemId()));

        int savedCount = 0;

        // Process each problem
        for (Map.Entry<UUID, List<Submission>> entry : byProblem.entrySet()) {
            UUID problemId = entry.getKey();
            List<Submission> problemSubs = entry.getValue();

            log.debug("Checking {} submissions for problem {}", problemSubs.size(), problemId);

            savedCount += checkPairwise(problemSubs);
        }

        log.info("Plagiarism check completed for contest {}. Found {} suspicious pairs.", contestId, savedCount);
    }

    /**
     * Pairwise comparison for a list of submissions.
     * Returns number of suspicious pairs saved.
     */
    private int checkPairwise(List<Submission> submissions) {
        int savedCount = 0;
        int n = submissions.size();

        for (int i = 0; i < n - 1; i++) {
            Submission sub1 = submissions.get(i);
            UUID user1Id = sub1.getSubmitter() != null ? sub1.getSubmitter().getUserId() : null;

            for (int j = i + 1; j < n; j++) {
                Submission sub2 = submissions.get(j);
                UUID user2Id = sub2.getSubmitter() != null ? sub2.getSubmitter().getUserId() : null;

                // Skip if same user
                if (user1Id != null && user1Id.equals(user2Id)) {
                    continue;
                }

                // Skip if already checked
                if (plagiarismRepository.existsBySubmission1SubmissionIdAndSubmission2SubmissionId(
                        sub1.getSubmissionId(), sub2.getSubmissionId())) {
                    continue;
                }

                // Calculate similarity
                double similarity = codeNormalizer.calculateSimilarity(
                        sub1.getSourceCode(),
                        sub2.getSourceCode(),
                        sub1.getLanguageId()
                );

                // Save if above threshold
                if (similarity >= THRESHOLD) {
                    PlagiarismCheck check = PlagiarismCheck.builder()
                            .submission1(sub1)
                            .submission2(sub2)
                            .similarityScore(similarity)
                            .build();

                    plagiarismRepository.save(check);
                    savedCount++;

                    log.info("Suspicious pair found: {} - {} with similarity {:.2f}",
                            sub1.getSubmissionId(), sub2.getSubmissionId(), similarity);
                }
            }
        }

        return savedCount;
    }

    /**
     * Get plagiarism results for a contest.
     */
    @PreAuthorize("hasAuthority('SUBMISSION_READ_ALL')")
    public List<PlagiarismResultResponse> getResults(UUID contestId) {
        List<PlagiarismCheck> checks = plagiarismRepository.findByContestId(contestId);

        return checks.stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Get plagiarism results for a specific problem in a contest.
     */
    @PreAuthorize("hasAuthority('SUBMISSION_READ_ALL')")
    public List<PlagiarismResultResponse> getResultsByProblem(UUID contestId, UUID problemId) {
        List<PlagiarismCheck> checks = plagiarismRepository.findByContestIdAndProblemId(contestId, problemId);

        return checks.stream()
                .map(this::toResponse)
                .toList();
    }

    private PlagiarismResultResponse toResponse(PlagiarismCheck check) {
        Submission sub1 = check.getSubmission1();
        Submission sub2 = check.getSubmission2();

        return PlagiarismResultResponse.builder()
                .checkId(check.getCheckId())
                .problemId(sub1.getProblem().getProblemId())
                .problemTitle(sub1.getProblem().getTitle())
                .submission1Id(sub1.getSubmissionId())
                .submission2Id(sub2.getSubmissionId())
                .user1Id(sub1.getSubmitter() != null ? sub1.getSubmitter().getUserId() : null)
                .user1Name(sub1.getSubmitter() != null ? sub1.getSubmitter().getFullName() : "Unknown")
                .user2Id(sub2.getSubmitter() != null ? sub2.getSubmitter().getUserId() : null)
                .user2Name(sub2.getSubmitter() != null ? sub2.getSubmitter().getFullName() : "Unknown")
                .similarity(check.getSimilarityScore())
                .checkedAt(check.getCheckedAt())
                .build();
    }
}
