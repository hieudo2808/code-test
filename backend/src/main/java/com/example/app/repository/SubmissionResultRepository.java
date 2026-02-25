package com.example.app.repository;

import com.example.app.entity.SubmissionResult;
import com.example.app.entity.enums.SubmissionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubmissionResultRepository extends JpaRepository<SubmissionResult, UUID> {

    List<SubmissionResult> findBySubmissionSubmissionId(UUID submissionId);

    Optional<SubmissionResult> findByJudge0Token(String token);

    @Query("SELECT COUNT(r) FROM SubmissionResult r WHERE r.submission.submissionId = :submissionId AND r.verdict IS NULL")
    long countUnfinished(@Param("submissionId") UUID submissionId);

    @Query("SELECT r FROM SubmissionResult r JOIN FETCH r.submission s JOIN FETCH r.testcase " +
           "WHERE r.verdict IS NULL AND s.submissionStatus = :status AND s.updateAt < :cutoff")
    List<SubmissionResult> findStaleResults(@Param("status") SubmissionStatus status, @Param("cutoff") OffsetDateTime cutoff);
}
