package com.example.app.repository;

import com.example.app.entity.Testcase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TestcaseRepository extends JpaRepository<Testcase, UUID> {
    // All testcases for a problem (for instructor/judge)
    List<Testcase> findByProblemProblemId(UUID problemId);
    
    // Only visible testcases for students
    List<Testcase> findByProblemProblemIdAndIsHiddenFalse(UUID problemId);
    
    // Sum of testcase points for a problem
    @Query("SELECT COALESCE(SUM(t.testcasePoint), 0) FROM Testcase t WHERE t.problem.problemId = :problemId")
    Double sumTestcasePointsByProblemId(@Param("problemId") UUID problemId);
}
