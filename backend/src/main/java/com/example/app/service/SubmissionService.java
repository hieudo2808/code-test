package com.example.app.service;

import com.example.app.dto.request.submission.ManualGradeRequest;
import com.example.app.dto.request.submission.SubmitCodeRequest;
import com.example.app.dto.response.SubmissionResponse;
import com.example.app.entity.Contest;
import com.example.app.entity.Problem;
import com.example.app.entity.Submission;
import com.example.app.entity.SubmissionResult;
import com.example.app.entity.Users;
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
import com.example.app.service.submission.event.SubmissionCreatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

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
    private final ContestService contestService;
    private final R2StorageService storageService;
    private final SubmissionMapper submissionMapper;
    private final SecurityHelper securityHelper;
    private final ApplicationEventPublisher eventPublisher;

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

        // Publish event after transaction commits
        final UUID submissionId = submission.getSubmissionId();
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                eventPublisher.publishEvent(new SubmissionCreatedEvent(submissionId));
            }
        });

        return submissionMapper.toResponse(submission);
    }

    @PreAuthorize("hasAuthority('SUBMISSION_READ_SELF') or hasAuthority('SUBMISSION_READ_ALL')")
    public SubmissionResponse getSubmission(UUID submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new AppException(ErrorCode.SUBMISSION_NOT_FOUND));

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
    public Page<SubmissionResponse> getMySubmissionsByProblem(UUID problemId, UUID contestId, Pageable pageable) {
        UUID currentUserId = securityHelper.getCurrentUserId();

        Page<Submission> page;
        if (contestId != null) {
            page = submissionRepository.findBySubmitterUserIdAndProblemProblemIdAndContestContestId(
                    currentUserId, problemId, contestId, pageable);
        } else {
            page = submissionRepository.findBySubmitterUserIdAndProblemProblemIdAndContestIsNull(
                    currentUserId, problemId, pageable);
        }
        return page.map(submissionMapper::toResponse);
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
                                                             String submitterName, String verdict,
                                                             Pageable pageable) {
        com.example.app.entity.enums.Verdict v = parseVerdict(verdict);
        return submissionRepository.searchContestSubmissions(contestId, problemId, submitterName, v, pageable)
                .map(submissionMapper::toResponse);
    }

    @PreAuthorize("hasAuthority('SUBMISSION_READ_ALL')")
    public Page<SubmissionResponse> searchProblemSubmissions(UUID problemId, String submitterName,
                                                             String verdict, Pageable pageable) {
        com.example.app.entity.enums.Verdict v = parseVerdict(verdict);
        return submissionRepository.searchProblemSubmissions(problemId, submitterName, v, pageable)
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

        // Publish event after transaction commits
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                eventPublisher.publishEvent(new SubmissionCreatedEvent(submissionId));
            }
        });

        return submissionMapper.toResponse(submission);
    }

    @Transactional
    @PreAuthorize("hasAuthority('SUBMISSION_READ_ALL')")
    public SubmissionResponse manualGrade(UUID submissionId, ManualGradeRequest request) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new AppException(ErrorCode.SUBMISSION_NOT_FOUND));

        if (submission.getSubmissionStatus() != SubmissionStatus.NEED_REVIEW && 
            !(submission.getSubmissionStatus() == SubmissionStatus.DONE && submission.getProblem().getEvaluationType() == com.example.app.entity.enums.EvaluationType.MANUAL)) {
            throw new AppException(ErrorCode.SUBMISSION_NOT_GRADABLE);
        }

        // Validate score is within range
        Double maxScore = submission.getProblem().getMaxScore();
        if (request.getScore() < 0 || (maxScore != null && request.getScore() > maxScore)) {
            throw new AppException(ErrorCode.SCORE_OUT_OF_RANGE);
        }

        submission.setFinalScore(request.getScore());
        submission.setFinalVerdict(request.getVerdict());
        submission.setSubmissionStatus(SubmissionStatus.DONE);
        submission = submissionRepository.save(submission);

        log.info("Manual graded submission: {} with score={} verdict={}",
                submissionId, request.getScore(), request.getVerdict());

        return submissionMapper.toResponse(submission);
    }

    @Transactional
    @PreAuthorize("hasAuthority('SUBMISSION_DELETE') or hasAuthority('SUBMISSION_READ_ALL')")
    public void deleteSubmission(UUID submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new AppException(ErrorCode.SUBMISSION_NOT_FOUND));

        submissionRepository.delete(submission);
        log.info("Deleted submission: {}", submissionId);
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

    private com.example.app.entity.enums.Verdict parseVerdict(String verdict) {
        if (verdict == null || verdict.isBlank()) {
            return null;
        }
        try {
            return com.example.app.entity.enums.Verdict.valueOf(verdict);
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }
}
