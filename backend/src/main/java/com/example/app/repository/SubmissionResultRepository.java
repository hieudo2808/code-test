package com.example.app.repository;

import com.example.app.entity.SubmissionResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubmissionResultRepository extends JpaRepository<SubmissionResult, UUID> {

    List<SubmissionResult> findBySubmissionSubmissionId(UUID submissionId);

    Optional<SubmissionResult> findByJudge0Token(String token);

    @Query("SELECT COUNT(r) FROM SubmissionResult r WHERE r.submission.submissionId = :submissionId AND r.verdict IS NULL")
    long countPendingBySubmissionId(@Param("submissionId") UUID submissionId);

    @Query("SELECT COALESCE(SUM(r.score), 0) FROM SubmissionResult r WHERE r.submission.submissionId = :submissionId")
    Double sumScoreBySubmissionId(@Param("submissionId") UUID submissionId);
}
