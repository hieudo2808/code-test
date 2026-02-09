package com.example.app.repository;

import com.example.app.entity.PlagiarismCheck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PlagiarismCheckRepository extends JpaRepository<PlagiarismCheck, UUID> {

    @Query("SELECT pc FROM PlagiarismCheck pc " +
           "WHERE pc.submission1.contest.contestId = :contestId " +
           "ORDER BY pc.similarityScore DESC")
    List<PlagiarismCheck> findByContestId(@Param("contestId") UUID contestId);

    @Query("SELECT pc FROM PlagiarismCheck pc " +
           "WHERE pc.submission1.contest.contestId = :contestId " +
           "AND pc.submission1.problem.problemId = :problemId " +
           "ORDER BY pc.similarityScore DESC")
    List<PlagiarismCheck> findByContestIdAndProblemId(
            @Param("contestId") UUID contestId, 
            @Param("problemId") UUID problemId);

    boolean existsBySubmission1SubmissionIdAndSubmission2SubmissionId(UUID sub1Id, UUID sub2Id);

    @Query("DELETE FROM PlagiarismCheck pc WHERE pc.submission1.contest.contestId = :contestId")
    void deleteByContestId(@Param("contestId") UUID contestId);
}
