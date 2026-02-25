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
import com.example.app.repository.ProblemRepository;
import com.example.app.repository.SubmissionRepository;
import com.example.app.repository.UserRepository;
import com.example.app.repository.ContestProblemRepository;
import com.example.app.security.SecurityHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

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
        if (!problem.getIsPublic() && canManageProblem(problem)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        return problemMapper.toResponse(problem);
    }

    @PreAuthorize("hasAuthority('PROBLEM_READ')")
    public ProblemResponse getProblemById(UUID problemId) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new AppException(ErrorCode.PROBLEM_NOT_FOUND));

        if (!problem.getIsPublic() && canManageProblem(problem)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        return problemMapper.toResponse(problem);
    }

    @PreAuthorize("hasAuthority('PROBLEM_READ')")
    public Page<ProblemSummaryResponse> getAllProblems(Pageable pageable) {
        if (securityHelper.hasAuthority("PROBLEM_CREATE")) {
            return problemRepository.findAll(pageable).map(this::toSummaryWithStats);
        } else {
            return problemRepository.findByIsPublicTrue(pageable).map(this::toSummaryWithStats);
        }
    }

    @PreAuthorize("hasAuthority('PROBLEM_CREATE')")
    public Page<ProblemSummaryResponse> getMyProblems(String keyword, Pageable pageable) {
        UUID currentUserId = securityHelper.getCurrentUserId();
        if (keyword != null && !keyword.isBlank()) {
            return problemRepository.searchByCreator(currentUserId, keyword.trim(), pageable)
                    .map(this::toSummaryWithStats);
        }
        return problemRepository.findByProblemCreatorUserId(currentUserId, pageable)
                .map(this::toSummaryWithStats);
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

        contestProblemRepository.deleteAllByProblemProblemId(problemId);

        problemRepository.deleteById(problemId);
        log.info("Deleted problem: {}", problemId);
    }

    // ==================== HELPERS ====================

    private boolean canManageProblem(Problem problem) {
        UUID currentUserId = securityHelper.getCurrentUserId();
        if (currentUserId == null) return true;
        
        // Admin can manage all
        if (securityHelper.hasAuthority("USER_MANAGE")) return false;
        
        // Creator can manage their own
        return problem.getProblemCreator() == null
                || !currentUserId.equals(problem.getProblemCreator().getUserId());
    }

    private ProblemSummaryResponse toSummaryWithStats(Problem problem) {
        ProblemSummaryResponse res = problemMapper.toSummary(problem);
        long total = submissionRepository.countByProblemProblemId(problem.getProblemId());
        if (total > 0) {
            long accepted = submissionRepository.countByProblemProblemIdAndFinalVerdict(
                    problem.getProblemId(), com.example.app.entity.enums.Verdict.ACCEPTED);
            res.setAcceptanceRate((double) accepted / total * 100.0);
        }
        return res;
    }
}
