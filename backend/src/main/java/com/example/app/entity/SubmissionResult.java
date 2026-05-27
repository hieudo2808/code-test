package com.example.app.entity;

import com.example.app.entity.enums.Verdict;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "SubmissionResults", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"submissionId", "testCaseId"}))
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionResult {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "submissionResultId")
    private UUID submissionResultId;

    @Column(name = "judge0Token", length = 50)
    private String judge0Token;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submissionId", nullable = false)
    private Submission submission;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "testCaseId", nullable = false)
    private Testcase testcase;

    @Column(name = "errorMessage", length = 500)
    private String errorMessage;

    @Column(name = "timeMs")
    private Double timeMs;

    @Column(name = "memoryKb")
    private Double memoryKb;

    @Column(name = "score")
    private Double score;

    @Enumerated(EnumType.STRING)
    @Column(name = "verdict", length = 20)
    private Verdict verdict;

    @Column(name = "dispatched_at")
    private OffsetDateTime dispatchedAt;
}
