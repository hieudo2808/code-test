package com.example.app.repository;

import com.example.app.entity.Problem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProblemRepository extends JpaRepository<Problem, UUID> {
    
    Optional<Problem> findBySlug(String slug);
    
    boolean existsBySlug(String slug);
    
    // For students - only public problems
    Page<Problem> findByIsPublicTrue(Pageable pageable);
    
    // Check if problem has submissions (for delete validation)
    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END " +
           "FROM Submission s WHERE s.problem.problemId = :problemId")
    boolean hasSubmissions(@Param("problemId") UUID problemId);

    long countByIsPublicTrue();
}
