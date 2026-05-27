package com.example.app.service;

import com.example.app.dto.request.problem.CreateProblemRequest;
import com.example.app.dto.request.problem.UpdateProblemRequest;
import com.example.app.dto.response.ProblemResponse;
import com.example.app.dto.response.ProblemSummaryResponse;
import com.example.app.entity.Problem;
import com.example.app.entity.Users;
import com.example.app.exception.AppException;
import com.example.app.exception.ErrorCode;
import com.example.app.mapper.ProblemMapper;
import com.example.app.entity.Testcase;
import com.example.app.entity.SubmissionResult;
import com.example.app.repository.ProblemRepository;
import com.example.app.repository.SubmissionRepository;
import com.example.app.repository.UserRepository;
import com.example.app.repository.ContestProblemRepository;
import com.example.app.repository.TestcaseRepository;
import com.example.app.repository.SubmissionResultRepository;
import com.example.app.security.SecurityHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProblemService {
    private final ProblemRepository problemRepository;
    private final UserRepository userRepository;
    private final SubmissionRepository submissionRepository;
    private final ContestProblemRepository contestProblemRepository;
    private final ProblemMapper problemMapper;
    private final SecurityHelper securityHelper;
    private final TestcaseRepository testcaseRepository;
    private final SubmissionResultRepository submissionResultRepository;
    private final R2StorageService storageService;

    // ==================== CREATE ====================
    
    @Transactional
    @PreAuthorize("hasAuthority('PROBLEM_CREATE')")
    public ProblemResponse createProblem(CreateProblemRequest request) {
        // Validate slug uniqueness
        if (problemRepository.existsBySlug(request.getSlug())) {
            throw new AppException(ErrorCode.SLUG_EXISTED);
        }

        Problem problem = problemMapper.toProblem(request);
        
        // Set creator
        UUID currentUserId = securityHelper.getCurrentUserId();
        Users creator = userRepository.findById(currentUserId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        problem.setProblemCreator(creator);

        // Set defaults
        if (problem.getIsPublic() == null) problem.setIsPublic(true);
        if (problem.getMaxScore() == null) problem.setMaxScore(100.0);

        Problem saved = problemRepository.save(problem);
        log.info("Created problem: {} by user: {}", saved.getSlug(), currentUserId);
        
        return problemMapper.toResponse(saved);
    }

    // ==================== READ ====================

    @PreAuthorize("hasAuthority('PROBLEM_READ')")
    public ProblemResponse getProblemBySlug(String slug) {
        Problem problem = problemRepository.findBySlug(slug)
                .orElseThrow(() -> new AppException(ErrorCode.PROBLEM_NOT_FOUND));

        // Students can only see public problems
        if (!problem.getIsPublic() && isRestrictedForCurrentUser(problem)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        return problemMapper.toResponse(problem);
    }

    @PreAuthorize("hasAuthority('PROBLEM_READ')")
    public ProblemResponse getProblemById(UUID problemId) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new AppException(ErrorCode.PROBLEM_NOT_FOUND));

        if (!problem.getIsPublic() && isRestrictedForCurrentUser(problem)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        return problemMapper.toResponse(problem);
    }

    @PreAuthorize("hasAuthority('PROBLEM_READ')")
    public Page<ProblemSummaryResponse> getAllProblems(Pageable pageable) {
        Page<Problem> problemsPage;
        if (securityHelper.hasAuthority("PROBLEM_CREATE")) {
            problemsPage = problemRepository.findAll(pageable);
        } else {
            problemsPage = problemRepository.findByIsPublicTrue(pageable);
        }
        return enrichProblemsPageWithStats(problemsPage);
    }

    @PreAuthorize("hasAuthority('PROBLEM_CREATE')")
    public Page<ProblemSummaryResponse> getMyProblems(String keyword, Pageable pageable) {
        UUID currentUserId = securityHelper.getCurrentUserId();
        Page<Problem> problemsPage;
        if (keyword != null && !keyword.isBlank()) {
            problemsPage = problemRepository.searchByCreator(currentUserId, keyword.trim(), pageable);
        } else {
            problemsPage = problemRepository.findByProblemCreatorUserId(currentUserId, pageable);
        }
        return enrichProblemsPageWithStats(problemsPage);
    }

    // ==================== UPDATE ====================

    @Transactional
    @PreAuthorize("hasAuthority('PROBLEM_UPDATE') and " +
                  "(@security.isProblemOwner(#problemId) or hasAuthority('USER_MANAGE'))")
    public ProblemResponse updateProblem(UUID problemId, UpdateProblemRequest request) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new AppException(ErrorCode.PROBLEM_NOT_FOUND));

        problemMapper.updateFromRequest(request, problem);
        
        Problem saved = problemRepository.save(problem);
        log.info("Updated problem: {}", saved.getSlug());
        
        return problemMapper.toResponse(saved);
    }

    // ==================== DELETE ====================

    @Transactional
    @PreAuthorize("hasAuthority('PROBLEM_DELETE') and " +
                  "(@security.isProblemOwner(#problemId) or hasAuthority('USER_MANAGE'))")
    public void deleteProblem(UUID problemId) {
        if (!problemRepository.existsById(problemId)) {
            throw new AppException(ErrorCode.PROBLEM_NOT_FOUND);
        }

        // Clean S3 files for all problem's testcases
        List<Testcase> testcases = testcaseRepository.findByProblemProblemId(problemId);
        for (Testcase tc : testcases) {
            // Delete submission outputs from S3
            List<SubmissionResult> results = submissionResultRepository.findByTestcaseTestcaseId(tc.getTestcaseId());
            for (SubmissionResult result : results) {
                if (result.getSubmission() != null) {
                    String userOutputPath = String.format("submissions/%s/results/%s/output.txt",
                            result.getSubmission().getSubmissionId(), tc.getTestcaseId());
                    storageService.delete(userOutputPath);
                }
            }
            // Delete testcase files from S3
            storageService.delete(tc.getInputPath());
            storageService.delete(tc.getOutputPath());
        }

        contestProblemRepository.deleteAllByProblemProblemId(problemId);

        problemRepository.deleteById(problemId);
        log.info("Deleted problem: {}", problemId);
    }

    // ==================== HELPERS ====================

    /**
     * Returns true if the current user should NOT be allowed to view a private problem.
     * Admin and problem creator are unrestricted; all others are restricted.
     */
    private boolean isRestrictedForCurrentUser(Problem problem) {
        UUID currentUserId = securityHelper.getCurrentUserId();
        if (currentUserId == null) return true; // Anonymous -> restricted

        // Admin can view all problems
        if (securityHelper.hasAuthority("USER_MANAGE")) return false; // Admin -> unrestricted

        // Creator can view their own problems
        if (problem.getProblemCreator() != null
                && currentUserId.equals(problem.getProblemCreator().getUserId())) {
            return false; // Creator -> unrestricted
        }

        return true; // Others -> restricted
    }

    private Page<ProblemSummaryResponse> enrichProblemsPageWithStats(Page<Problem> problemsPage) {
        Page<ProblemSummaryResponse> responsesPage = problemsPage.map(problemMapper::toSummary);
        if (responsesPage.isEmpty()) {
            return responsesPage;
        }

        List<UUID> problemIds = responsesPage.getContent().stream()
                .map(ProblemSummaryResponse::getProblemId)
                .toList();

        List<Object[]> statsList = submissionRepository.countStatsForProblems(problemIds);
        Map<UUID, Object[]> statsMap = new HashMap<>();
        for (Object[] row : statsList) {
            if (row != null && row[0] != null) {
                statsMap.put((UUID) row[0], row);
            }
        }

        for (ProblemSummaryResponse response : responsesPage.getContent()) {
            Object[] stats = statsMap.get(response.getProblemId());
            if (stats != null) {
                long total = (long) stats[1];
                long accepted = (long) stats[2];
                if (total > 0) {
                    response.setAcceptanceRate((double) accepted / total * 100.0);
                }
            }
        }

        return responsesPage;
    }
}
