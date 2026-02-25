package com.example.app.repository;

import com.example.app.entity.ContestProblem;
import com.example.app.entity.ContestProblemId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContestProblemRepository extends JpaRepository<ContestProblem, ContestProblemId> {
    List<ContestProblem> findByContestContestId(UUID contestId);

    Optional<ContestProblem> findByContestContestIdAndProblemProblemId(UUID contestId, UUID problemId);

    void deleteAllByProblemProblemId(UUID problemId);
}
