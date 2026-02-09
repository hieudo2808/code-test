package com.example.app.repository;

import com.example.app.entity.Submission;
import com.example.app.entity.enums.SubmissionStatus;
import com.example.app.entity.enums.Verdict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, UUID> {

    Page<Submission> findBySubmitterUserId(UUID submitterId, Pageable pageable);

    Page<Submission> findByProblemProblemId(UUID problemId, Pageable pageable);

    Page<Submission> findByContestContestId(UUID contestId, Pageable pageable);

    long countBySubmitterUserIdAndSubmissionStatus(UUID submitterId, SubmissionStatus status);

    long countByContestContestIdAndProblemProblemIdAndSubmitterUserId(UUID contestId, UUID problemId, UUID submitterId);

    // Statistics
    long countBySubmitterUserId(UUID submitterId);

    long countBySubmitterUserIdAndFinalVerdict(UUID submitterId, Verdict verdict);

    long countByProblemProblemId(UUID problemId);

    long countByProblemProblemIdAndFinalVerdict(UUID problemId, Verdict verdict);

    @Query("SELECT COUNT(DISTINCT s.problem.problemId) FROM Submission s " +
           "WHERE s.submitter.userId = :userId AND s.finalVerdict = 'ACCEPTED'")
    long countDistinctAcceptedProblemsByUser(@Param("userId") UUID userId);

    @Query("SELECT COUNT(DISTINCT s.submitter.userId) FROM Submission s " +
           "WHERE s.problem.problemId = :problemId AND s.finalVerdict = 'ACCEPTED'")
    long countDistinctSolversByProblem(@Param("problemId") UUID problemId);

    // Admin stats
    long countBySubmissionStatus(SubmissionStatus status);
}
