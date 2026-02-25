package com.example.app.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "PlagiarismChecks", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"submission1Id", "submission2Id"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlagiarismCheck {

    @Id
    @Column(name = "checkId")
    private UUID checkId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission1Id", nullable = false)
    private Submission submission1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission2Id", nullable = false)
    private Submission submission2;

    @Column(name = "similarityScore", nullable = false)
    private Double similarityScore;

    @Column(name = "lexicalScore")
    private Double lexicalScore;

    @Column(name = "astScore")
    private Double astScore;

    @Column(name = "cfgScore")
    private Double cfgScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "verdict")
    private com.example.app.entity.enums.PlagiarismVerdict verdict;

    @CreationTimestamp
    @Column(name = "checkedAt", nullable = false)
    private OffsetDateTime checkedAt;

    @PrePersist
    public void prePersist() {
        if (checkId == null) {
            checkId = UUID.randomUUID();
        }
    }
}
