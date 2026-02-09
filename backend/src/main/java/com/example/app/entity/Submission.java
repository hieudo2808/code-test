package com.example.app.entity;

import com.example.app.entity.enums.SubmissionStatus;
import com.example.app.entity.enums.Verdict;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "Submissions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Submission {

    @Id
    @Column(name = "submissionId")
    private UUID submissionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitterId")
    private Users submitter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problemId", nullable = false)
    private Problem problem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contestId")
    private Contest contest;

    @Column(name = "sourceCode", columnDefinition = "NVARCHAR(MAX)", nullable = false)
    private String sourceCode;

    @Column(name = "languageId", nullable = false)
    private Integer languageId;

    @Enumerated(EnumType.STRING)
    @Column(name = "submissionStatus", length = 20, nullable = false)
    private SubmissionStatus submissionStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "finalVerdict", length = 20)
    private Verdict finalVerdict;

    @Column(name = "finalScore")
    private Double finalScore;

    @Column(name = "compileTimeMs")
    private Double compileTimeMs;

    @Column(name = "totalTimeMs")
    private Double totalTimeMs;

    @Column(name = "peakMemoryKb")
    private Double peakMemoryKb;

    @Column(name = "judgeNode", length = 64)
    private String judgeNode;

    @Column(name = "judgeVersion", length = 32)
    private String judgeVersion;

    @CreationTimestamp
    @Column(name = "createAt", nullable = false)
    private OffsetDateTime createAt;

    @UpdateTimestamp
    @Column(name = "updateAt", nullable = false)
    private OffsetDateTime updateAt;

    @OneToMany(mappedBy = "submission", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SubmissionResult> results = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (submissionId == null) {
            submissionId = UUID.randomUUID();
        }
        if (submissionStatus == null) {
            submissionStatus = SubmissionStatus.PENDING;
        }
    }
}
