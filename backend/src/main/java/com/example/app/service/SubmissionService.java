package com.example.app.service;

import com.example.app.dto.request.submission.SubmitCodeRequest;
import com.example.app.dto.response.SubmissionResponse;
import com.example.app.dto.response.TestcaseDetailResponse;
import com.example.app.entity.Contest;
import com.example.app.entity.Problem;
import com.example.app.entity.Submission;
import com.example.app.entity.SubmissionResult;
import com.example.app.entity.Users;
import com.example.app.entity.enums.EvaluationType;
import com.example.app.entity.enums.SubmissionStatus;
import com.example.app.exception.AppException;
import com.example.app.exception.ErrorCode;
import com.example.app.mapper.SubmissionMapper;
import com.example.app.repository.ContestRepository;
import com.example.app.repository.ProblemRepository;
import com.example.app.repository.SubmissionRepository;
import com.example.app.repository.SubmissionResultRepository;
import com.example.app.repository.UserRepository;
import com.example.app.security.SecurityHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final SubmissionResultRepository resultRepository;
    private final ProblemRepository problemRepository;
    private final UserRepository userRepository;
    private final ContestRepository contestRepository;
    private final JudgeService judgeService;
    private final ContestService contestService;
    private final S3StorageService storageService;
    private final SubmissionMapper submissionMapper;
    private final SecurityHelper securityHelper;

    @Transactional
    @PreAuthorize("hasAuthority('SUBMISSION_CREATE')")
    public SubmissionResponse submit(SubmitCodeRequest request) {
        Problem problem = problemRepository.findById(request.getProblemId())
                .orElseThrow(() -> new AppException(ErrorCode.PROBLEM_NOT_FOUND));

        UUID currentUserId = securityHelper.getCurrentUserId();

        // Contest submission validation
        Contest contest = null;
        if (request.getContestId() != null) {
            contestService.validateContestSubmission(
                    request.getContestId(),
                    request.getProblemId(),
                    currentUserId
            );
            contest = contestRepository.findById(request.getContestId()).orElse(null);
        } else {
            // Practice submission - check problem accessibility
            if (!problem.getIsPublic() && !canAccessProblem(problem)) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }
        }

        Users submitter = userRepository.findById(currentUserId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Submission submission = Submission.builder()
                .submitter(submitter)
                .problem(problem)
                .contest(contest)
                .sourceCode(request.getSourceCode())
                .languageId(request.getLanguageId())
                .submissionStatus(SubmissionStatus.PENDING)
                .build();

        submission = submissionRepository.save(submission);
        log.info("Created submission: {} for problem: {} by user: {}", 
                submission.getSubmissionId(), problem.getSlug(), currentUserId);

        // Trigger async judging based on evaluation type
        triggerJudge(submission, problem.getEvaluationType());

        return submissionMapper.toResponse(submission);
    }

    @PreAuthorize("hasAuthority('SUBMISSION_READ_SELF') or hasAuthority('SUBMISSION_READ_ALL')")
    public SubmissionResponse getSubmission(UUID submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new AppException(ErrorCode.SUBMISSION_NOT_FOUND));

        // Check ownership
        boolean canViewAll = securityHelper.hasAuthority("SUBMISSION_READ_ALL");
        boolean isOwner = isSubmissionOwner(submission);

        if (!canViewAll && !isOwner) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        List<SubmissionResult> results = resultRepository.findBySubmissionSubmissionId(submissionId);
        return submissionMapper.toResponseWithResults(submission, results, canViewAll);
    }

    @PreAuthorize("hasAuthority('SUBMISSION_READ_SELF')")
    public Page<SubmissionResponse> getMySubmissions(Pageable pageable) {
        UUID currentUserId = securityHelper.getCurrentUserId();
        return submissionRepository.findBySubmitterUserId(currentUserId, pageable)
                .map(submissionMapper::toResponse);
    }

    @PreAuthorize("hasAuthority('SUBMISSION_READ_SELF')")
    public Page<SubmissionResponse> getMySubmissionsByProblem(UUID problemId, Pageable pageable) {
        UUID currentUserId = securityHelper.getCurrentUserId();
        return submissionRepository.findBySubmitterUserIdAndProblemProblemId(currentUserId, problemId, pageable)
                .map(submissionMapper::toResponse);
    }

    @PreAuthorize("hasAuthority('SUBMISSION_READ_ALL')")
    public Page<SubmissionResponse> getAllSubmissions(Pageable pageable) {
        return submissionRepository.findAll(pageable)
                .map(submissionMapper::toResponse);
    }

    @PreAuthorize("hasAuthority('SUBMISSION_READ_ALL')")
    public Page<SubmissionResponse> getSubmissionsByProblem(UUID problemId, Pageable pageable) {
        return submissionRepository.findByProblemProblemId(problemId, pageable)
                .map(submissionMapper::toResponse);
    }

    @PreAuthorize("hasAuthority('SUBMISSION_READ_ALL')")
    public Page<SubmissionResponse> searchContestSubmissions(UUID contestId, UUID problemId,
                                                             UUID submitterId, String verdict,
                                                             Pageable pageable) {
        com.example.app.entity.enums.Verdict v = null;
        if (verdict != null && !verdict.isBlank()) {
            try {
                v = com.example.app.entity.enums.Verdict.valueOf(verdict);
            } catch (IllegalArgumentException ignored) {}
        }
        return submissionRepository.searchContestSubmissions(contestId, problemId, submitterId, v, pageable)
                .map(submissionMapper::toResponse);
    }

    @PreAuthorize("hasAuthority('SUBMISSION_READ_ALL')")
    public Page<SubmissionResponse> searchProblemSubmissions(UUID problemId, UUID submitterId,
                                                             String verdict, Pageable pageable) {
        com.example.app.entity.enums.Verdict v = null;
        if (verdict != null && !verdict.isBlank()) {
            try {
                v = com.example.app.entity.enums.Verdict.valueOf(verdict);
            } catch (IllegalArgumentException ignored) {}
        }
        return submissionRepository.searchProblemSubmissions(problemId, submitterId, v, pageable)
                .map(submissionMapper::toResponse);
    }

    @Transactional
    @PreAuthorize("hasAuthority('SUBMISSION_REJUDGE')")
    public SubmissionResponse rejudge(UUID submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new AppException(ErrorCode.SUBMISSION_NOT_FOUND));

        if (submission.getSubmissionStatus() == SubmissionStatus.RUNNING ||
            submission.getSubmissionStatus() == SubmissionStatus.COMPILING) {
            throw new AppException(ErrorCode.SUBMISSION_ALREADY_JUDGING);
        }

        // Clear old results
        resultRepository.deleteAll(resultRepository.findBySubmissionSubmissionId(submissionId));

        // Reset submission
        submission.setSubmissionStatus(SubmissionStatus.PENDING);
        submission.setFinalScore(null);
        submission.setFinalVerdict(null);
        submission.setTotalTimeMs(null);
        submission.setPeakMemoryKb(null);
        submission = submissionRepository.save(submission);

        log.info("Rejudging submission: {}", submissionId);

        // Trigger judging
        triggerJudge(submission, submission.getProblem().getEvaluationType());

        return submissionMapper.toResponse(submission);
    }

    @PreAuthorize("hasAuthority('SUBMISSION_READ_SELF') or hasAuthority('SUBMISSION_READ_ALL')")
    public TestcaseDetailResponse getTestcaseDetail(UUID submissionId, UUID testcaseId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new AppException(ErrorCode.SUBMISSION_NOT_FOUND));

        boolean canViewAll = securityHelper.hasAuthority("SUBMISSION_READ_ALL");
        boolean isOwner = isSubmissionOwner(submission);

        if (!canViewAll && !isOwner) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        // Find the submission result for this testcase
        SubmissionResult result = resultRepository.findBySubmissionSubmissionId(submissionId).stream()
                .filter(r -> r.getTestcase().getTestcaseId().equals(testcaseId))
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.SUBMISSION_NOT_FOUND));

        // Hidden testcase: only admins/instructors can view detail
        if (result.getTestcase().getIsHidden() && !canViewAll) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        // Read input and expected output from S3
        String input = readFromS3(result.getTestcase().getInputPath());
        String expectedOutput = readFromS3(result.getTestcase().getOutputPath());

        // Read user output from S3
        String userOutputPath = String.format("submissions/%s/results/%s/output.txt",
                submissionId, testcaseId);
        String actualOutput = readFromS3(userOutputPath);

        return TestcaseDetailResponse.builder()
                .input(input)
                .expectedOutput(expectedOutput)
                .actualOutput(actualOutput)
                .build();
    }

    private String readFromS3(String path) {
        try {
            byte[] bytes = storageService.getFile(path).readAllBytes();
            String content = new String(bytes).trim();
            // Try Base64 decode (old submissions may have stored Base64-encoded output)
            return tryDecodeBase64(content);
        } catch (Exception e) {
            log.warn("Failed to read file from S3: {}", path, e);
            return "";
        }
    }

    private String tryDecodeBase64(String value) {
        if (value == null || value.isEmpty()) return value;
        try {
            // Only attempt decode if it looks like Base64 (no spaces, no newlines in first line)
            if (!value.contains(" ") && !value.contains("\n") && value.matches("^[A-Za-z0-9+/=]+$")) {
                return new String(Base64.getDecoder().decode(value));
            }
        } catch (IllegalArgumentException ignored) {
        }
        return value;
    }

    private void triggerJudge(Submission submission, EvaluationType evalType) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    switch (evalType) {
                        case EXACT -> judgeService.judgeExact(submission);
                        case HEURISTIC -> judgeService.judgeHeuristic(submission);
                        case MANUAL -> judgeService.markForManualReview(submission);
                    }
                } catch (Exception e) {
                    log.error("Failed to trigger judge after commit", e);
                }
            }
        });
    }

    private boolean isSubmissionOwner(Submission submission) {
        UUID currentUserId = securityHelper.getCurrentUserId();
        return currentUserId != null && 
               submission.getSubmitter() != null &&
               currentUserId.equals(submission.getSubmitter().getUserId());
    }

    private boolean canAccessProblem(Problem problem) {
        return securityHelper.hasAuthority("PROBLEM_CREATE") || 
               securityHelper.isProblemOwner(problem.getProblemId());
    }
}
