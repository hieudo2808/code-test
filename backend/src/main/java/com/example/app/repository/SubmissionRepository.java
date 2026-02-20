package com.example.app.repository;

import com.example.app.entity.Submission;
import com.example.app.entity.enums.SubmissionStatus;
import com.example.app.entity.enums.Verdict;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Submission s WHERE s.submissionId = :id")
    Optional<Submission> findForUpdate(@Param("id") UUID id);

    Page<Submission> findBySubmitterUserId(UUID submitterId, Pageable pageable);

    Page<Submission> findByProblemProblemId(UUID problemId, Pageable pageable);

    Page<Submission> findByContestContestId(UUID contestId, Pageable pageable);

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

    Page<Submission> findBySubmitterUserIdAndProblemProblemId(UUID submitterId, UUID problemId, Pageable pageable);

    // Instructor: contest submissions with filters
    @Query("SELECT s FROM Submission s WHERE s.contest.contestId = :contestId" +
           " AND (:problemId IS NULL OR s.problem.problemId = :problemId)" +
           " AND (:submitterId IS NULL OR s.submitter.userId = :submitterId)" +
           " AND (:verdict IS NULL OR s.finalVerdict = :verdict)")
    Page<Submission> searchContestSubmissions(@Param("contestId") UUID contestId,
                                              @Param("problemId") UUID problemId,
                                              @Param("submitterId") UUID submitterId,
                                              @Param("verdict") Verdict verdict,
                                              Pageable pageable);

    // Instructor: problem submissions with filters
    @Query("SELECT s FROM Submission s WHERE s.problem.problemId = :problemId" +
           " AND s.contest IS NULL" +
           " AND (:submitterId IS NULL OR s.submitter.userId = :submitterId)" +
           " AND (:verdict IS NULL OR s.finalVerdict = :verdict)")
    Page<Submission> searchProblemSubmissions(@Param("problemId") UUID problemId,
                                              @Param("submitterId") UUID submitterId,
                                              @Param("verdict") Verdict verdict,
                                              Pageable pageable);

    Page<Submission> findByContestContestIdAndProblemProblemId(UUID contestId, UUID problemId, Pageable pageable);

    // Admin stats
    long countBySubmissionStatus(SubmissionStatus status);

    @Query("SELECT CAST(s.createAt AS DATE) AS day, COUNT(s) FROM Submission s " +
           "WHERE s.createAt >= :since GROUP BY CAST(s.createAt AS DATE) ORDER BY day")
    java.util.List<Object[]> countSubmissionsPerDay(@Param("since") OffsetDateTime since);

    @Query("SELECT s.finalVerdict, COUNT(s) FROM Submission s " +
           "WHERE s.finalVerdict IS NOT NULL GROUP BY s.finalVerdict")
    java.util.List<Object[]> countByVerdict();
}
