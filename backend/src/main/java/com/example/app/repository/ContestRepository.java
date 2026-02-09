package com.example.app.repository;

import com.example.app.entity.Contest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ContestRepository extends JpaRepository<Contest, UUID> {

    Page<Contest> findByIsPublicTrue(Pageable pageable);

    @Query("SELECT c FROM Contest c WHERE c.isPublic = true OR c.contestOwner.userId = :userId")
    Page<Contest> findAccessibleContests(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT c FROM Contest c WHERE c.endTime > :now ORDER BY c.startTime ASC")
    List<Contest> findUpcomingAndRunning(@Param("now") OffsetDateTime now);

    boolean existsByContestIdAndContestOwnerUserId(UUID contestId, UUID ownerId);
}
