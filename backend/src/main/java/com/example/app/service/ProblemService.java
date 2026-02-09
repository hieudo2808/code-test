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
import com.example.app.repository.UserRepository;
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
        if (!problem.getIsPublic() && !canManageProblem(problem)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        return problemMapper.toResponse(problem);
    }

    @PreAuthorize("hasAuthority('PROBLEM_READ')")
    public ProblemResponse getProblemById(UUID problemId) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new AppException(ErrorCode.PROBLEM_NOT_FOUND));

        if (!problem.getIsPublic() && !canManageProblem(problem)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        return problemMapper.toResponse(problem);
    }

    @PreAuthorize("hasAuthority('PROBLEM_READ')")
    public Page<ProblemSummaryResponse> getAllProblems(Pageable pageable) {
        // Check if user can see all problems (instructor/admin) or only public
        if (securityHelper.hasAuthority("PROBLEM_CREATE")) {
            // Instructor/Admin see all
            return problemRepository.findAll(pageable).map(problemMapper::toSummary);
        } else {
            // Student sees only public
            return problemRepository.findByIsPublicTrue(pageable).map(problemMapper::toSummary);
        }
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

        // Check if problem has submissions
        if (problemRepository.hasSubmissions(problemId)) {
            throw new AppException(ErrorCode.PROBLEM_HAS_SUBMISSIONS);
        }

        problemRepository.deleteById(problemId);
        log.info("Deleted problem: {}", problemId);
    }

    // ==================== HELPERS ====================

    private boolean canManageProblem(Problem problem) {
        UUID currentUserId = securityHelper.getCurrentUserId();
        if (currentUserId == null) return false;
        
        // Admin can manage all
        if (securityHelper.hasAuthority("USER_MANAGE")) return true;
        
        // Creator can manage their own
        return problem.getProblemCreator() != null 
                && currentUserId.equals(problem.getProblemCreator().getUserId());
    }
}
