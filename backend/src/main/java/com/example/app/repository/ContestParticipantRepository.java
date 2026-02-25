package com.example.app.repository;

import com.example.app.entity.ContestParticipant;
import com.example.app.entity.ContestParticipantId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ContestParticipantRepository extends JpaRepository<ContestParticipant, ContestParticipantId> {
    List<ContestParticipant> findByContestContestId(UUID contestId);

    boolean existsByContestContestIdAndParticipantUserId(UUID contestId, UUID userId);

    @Query("SELECT COUNT(cp) FROM ContestParticipant cp WHERE cp.contest.contestId = :contestId")
    int countByContestId(@Param("contestId") UUID contestId);

    long countByParticipantUserId(UUID userId);
}
