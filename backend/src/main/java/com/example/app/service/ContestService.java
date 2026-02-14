package com.example.app.service;

import com.example.app.dto.request.contest.AddContestProblemRequest;
import com.example.app.dto.request.contest.CreateContestRequest;
import com.example.app.dto.request.contest.UpdateContestRequest;
import com.example.app.dto.response.ContestParticipantResponse;
import com.example.app.dto.response.ContestProblemResponse;
import com.example.app.dto.response.ContestResponse;
import com.example.app.entity.*;
import com.example.app.entity.enums.ContestState;
import com.example.app.exception.AppException;
import com.example.app.exception.ErrorCode;
import com.example.app.mapper.ContestMapper;
import com.example.app.repository.*;
import com.example.app.security.SecurityHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ContestService {

    private final ContestRepository contestRepository;
    private final ContestProblemRepository contestProblemRepository;
    private final ContestParticipantRepository participantRepository;
    private final ProblemRepository problemRepository;
    private final SubmissionRepository submissionRepository;
    private final UserRepository userRepository;
    private final ContestMapper contestMapper;
    private final SecurityHelper securityHelper;

    // ==================== CRUD ====================

    @Transactional
    @PreAuthorize("hasAuthority('CONTEST_CREATE')")
    public ContestResponse createContest(CreateContestRequest request) {
        UUID currentUserId = securityHelper.getCurrentUserId();
        Users owner = userRepository.findById(currentUserId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Contest contest = Contest.builder()
                .contestName(request.getContestName())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .isPublic(request.getIsPublic())
                .contestOwner(owner)
                .build();

        contest = contestRepository.save(contest);
        log.info("Created contest: {} by user: {}", contest.getContestId(), currentUserId);

        return contestMapper.toResponse(contest, currentUserId, false);
    }

    @PreAuthorize("hasAuthority('CONTEST_READ')")
    public ContestResponse getContest(UUID contestId) {
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new AppException(ErrorCode.CONTEST_NOT_FOUND));

        UUID currentUserId = securityHelper.getCurrentUserId();
        boolean isJoined = participantRepository.existsByContestContestIdAndParticipantUserId(contestId, currentUserId);

        return contestMapper.toResponse(contest, currentUserId, isJoined);
    }

    @Transactional
    @PreAuthorize("hasAuthority('CONTEST_UPDATE')")
    public ContestResponse updateContest(UUID contestId, UpdateContestRequest request) {
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new AppException(ErrorCode.CONTEST_NOT_FOUND));

        // Check ownership (unless admin)
        if (!isContestOwnerOrAdmin(contest)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        if (request.getContestName() != null) contest.setContestName(request.getContestName());
        if (request.getStartTime() != null) contest.setStartTime(request.getStartTime());
        if (request.getEndTime() != null) contest.setEndTime(request.getEndTime());
        if (request.getIsPublic() != null) contest.setIsPublic(request.getIsPublic());

        contest = contestRepository.save(contest);
        log.info("Updated contest: {}", contestId);

        UUID currentUserId = securityHelper.getCurrentUserId();
        boolean isJoined = participantRepository.existsByContestContestIdAndParticipantUserId(contestId, currentUserId);
        return contestMapper.toResponse(contest, currentUserId, isJoined);
    }

    @Transactional
    @PreAuthorize("hasAuthority('CONTEST_DELETE')")
    public void deleteContest(UUID contestId) {
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new AppException(ErrorCode.CONTEST_NOT_FOUND));

        if (!isContestOwnerOrAdmin(contest)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        contestRepository.delete(contest);
        log.info("Deleted contest: {}", contestId);
    }

    @PreAuthorize("hasAuthority('CONTEST_READ')")
    public Page<ContestResponse> listContests(Pageable pageable) {
        UUID currentUserId = securityHelper.getCurrentUserId();
        return contestRepository.findAccessibleContests(currentUserId, pageable)
                .map(c -> {
                    boolean isJoined = participantRepository.existsByContestContestIdAndParticipantUserId(c.getContestId(), currentUserId);
                    return contestMapper.toResponse(c, currentUserId, isJoined);
                });
    }

    @PreAuthorize("hasAuthority('CONTEST_CREATE')")
    public Page<ContestResponse> listMyContests(Pageable pageable) {
        UUID currentUserId = securityHelper.getCurrentUserId();
        return contestRepository.findByContestOwnerUserId(currentUserId, pageable)
                .map(c -> {
                    boolean isJoined = participantRepository.existsByContestContestIdAndParticipantUserId(c.getContestId(), currentUserId);
                    return contestMapper.toResponse(c, currentUserId, isJoined);
                });
    }

    // ==================== PROBLEMS ====================

    @Transactional
    @PreAuthorize("hasAuthority('CONTEST_UPDATE')")
    public ContestProblemResponse addProblem(UUID contestId, AddContestProblemRequest request) {
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new AppException(ErrorCode.CONTEST_NOT_FOUND));

        if (!isContestOwnerOrAdmin(contest)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Problem problem = problemRepository.findById(request.getProblemId())
                .orElseThrow(() -> new AppException(ErrorCode.PROBLEM_NOT_FOUND));

        ContestProblemId cpId = new ContestProblemId(contestId, problem.getProblemId());
        ContestProblem cp = ContestProblem.builder()
                .id(cpId)
                .contest(contest)
                .problem(problem)
                .maxSubmissions(request.getMaxSubmissions())
                .build();

        contestProblemRepository.save(cp);
        log.info("Added problem {} to contest {}", problem.getProblemId(), contestId);

        return contestMapper.toProblemResponse(cp, 0);
    }

    @Transactional
    @PreAuthorize("hasAuthority('CONTEST_UPDATE')")
    public void removeProblem(UUID contestId, UUID problemId) {
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new AppException(ErrorCode.CONTEST_NOT_FOUND));

        if (!isContestOwnerOrAdmin(contest)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        ContestProblemId cpId = new ContestProblemId(contestId, problemId);
        contestProblemRepository.deleteById(cpId);
        log.info("Removed problem {} from contest {}", problemId, contestId);
    }

    @PreAuthorize("hasAuthority('CONTEST_READ')")
    public List<ContestProblemResponse> getProblems(UUID contestId) {
        UUID currentUserId = securityHelper.getCurrentUserId();
        List<ContestProblem> problems = contestProblemRepository.findByContestContestId(contestId);
        
        return problems.stream()
                .map(cp -> {
                    int userSubs = countUserSubmissions(contestId, cp.getProblem().getProblemId(), currentUserId);
                    return contestMapper.toProblemResponse(cp, userSubs);
                })
                .toList();
    }

    // ==================== PARTICIPATION ====================

    @Transactional
    @PreAuthorize("hasAuthority('CONTEST_JOIN')")
    public void joinContest(UUID contestId) {
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new AppException(ErrorCode.CONTEST_NOT_FOUND));

        UUID currentUserId = securityHelper.getCurrentUserId();

        // Already joined?
        if (participantRepository.existsByContestContestIdAndParticipantUserId(contestId, currentUserId)) {
            throw new AppException(ErrorCode.CONTEST_ALREADY_JOINED);
        }

        // Check if contest finished
        ContestState state = contest.getState();
        if (state == ContestState.FINISHED) {
            throw new AppException(ErrorCode.CONTEST_ENDED);
        }

        Users user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        ContestParticipantId cpId = new ContestParticipantId(contestId, currentUserId);
        ContestParticipant participant = ContestParticipant.builder()
                .id(cpId)
                .contest(contest)
                .participant(user)
                .build();

        participantRepository.save(participant);
        log.info("User {} joined contest {}", currentUserId, contestId);
    }

    @Transactional
    @PreAuthorize("hasAuthority('CONTEST_UPDATE')")
    public ContestParticipantResponse addParticipant(UUID contestId, String email) {
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new AppException(ErrorCode.CONTEST_NOT_FOUND));

        Users user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (participantRepository.existsByContestContestIdAndParticipantUserId(contestId, user.getUserId())) {
            throw new AppException(ErrorCode.CONTEST_ALREADY_JOINED);
        }

        ContestParticipantId cpId = new ContestParticipantId(contestId, user.getUserId());
        ContestParticipant participant = ContestParticipant.builder()
                .id(cpId)
                .contest(contest)
                .participant(user)
                .build();

        participantRepository.save(participant);
        log.info("Added participant {} to contest {} by instructor", user.getUserId(), contestId);

        return contestMapper.toParticipantResponse(participant);
    }

    @Transactional
    @PreAuthorize("hasAuthority('CONTEST_UPDATE')")
    public void removeParticipant(UUID contestId, UUID userId) {
        ContestParticipantId cpId = new ContestParticipantId(contestId, userId);
        if (!participantRepository.existsById(cpId)) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }
        participantRepository.deleteById(cpId);
        log.info("Removed participant {} from contest {}", userId, contestId);
    }

    @PreAuthorize("hasAuthority('CONTEST_READ')")
    public List<ContestParticipantResponse> getParticipants(UUID contestId) {
        return participantRepository.findByContestContestId(contestId).stream()
                .map(contestMapper::toParticipantResponse)
                .toList();
    }

    // ==================== SUBMISSION VALIDATION ====================

    /**
     * Validate if user can submit to a problem in a contest.
     * Called from SubmissionService.
     */
    public void validateContestSubmission(UUID contestId, UUID problemId, UUID userId) {
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new AppException(ErrorCode.CONTEST_NOT_FOUND));

        // Check state
        if (!contest.canSubmit()) {
            ContestState state = contest.getState();
            if (state == ContestState.UPCOMING) {
                throw new AppException(ErrorCode.CONTEST_NOT_STARTED);
            } else {
                throw new AppException(ErrorCode.CONTEST_ENDED);
            }
        }

        // Check joined
        if (!participantRepository.existsByContestContestIdAndParticipantUserId(contestId, userId)) {
            throw new AppException(ErrorCode.CONTEST_NOT_JOINED);
        }

        // Check problem in contest
        ContestProblem cp = contestProblemRepository.findByContestContestIdAndProblemProblemId(contestId, problemId)
                .orElseThrow(() -> new AppException(ErrorCode.PROBLEM_NOT_IN_CONTEST));

        // Check submission limit
        if (cp.getMaxSubmissions() != null) {
            int count = countUserSubmissions(contestId, problemId, userId);
            if (count >= cp.getMaxSubmissions()) {
                throw new AppException(ErrorCode.CONTEST_SUBMISSION_LIMIT);
            }
        }
    }

    // ==================== HELPERS ====================

    private boolean isContestOwnerOrAdmin(Contest contest) {
        UUID currentUserId = securityHelper.getCurrentUserId();
        if (securityHelper.hasAuthority("CONTEST_DELETE")) {  // Admin
            return true;
        }
        return contest.getContestOwner() != null && 
               contest.getContestOwner().getUserId().equals(currentUserId);
    }

    private int countUserSubmissions(UUID contestId, UUID problemId, UUID userId) {
        return (int) submissionRepository.countByContestContestIdAndProblemProblemIdAndSubmitterUserId(
                contestId, problemId, userId);
    }
}
