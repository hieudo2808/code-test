package com.example.app.entity;

import com.example.app.entity.enums.ContestState;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "Contests")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Contest {

    @Id
    @Column(name = "contestId")
    private UUID contestId;

    @Column(name = "contestName", nullable = false, length = 200)
    private String contestName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contestOwner")
    private Users contestOwner;

    @Column(name = "startTime")
    private OffsetDateTime startTime;

    @Column(name = "endTime")
    private OffsetDateTime endTime;

    @Column(name = "isPublic")
    @Builder.Default
    private Boolean isPublic = true;

    @CreationTimestamp
    @Column(name = "createAt", nullable = false)
    private OffsetDateTime createAt;

    @UpdateTimestamp
    @Column(name = "updateAt", nullable = false)
    private OffsetDateTime updateAt;

    @OneToMany(mappedBy = "contest", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ContestProblem> contestProblems = new ArrayList<>();

    @OneToMany(mappedBy = "contest", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ContestParticipant> participants = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (contestId == null) {
            contestId = UUID.randomUUID();
        }
    }

    /**
     * Compute contest state from timestamps.
     * NOT stored in DB - calculated at runtime.
     */
    @Transient
    public ContestState getState() {
        OffsetDateTime now = OffsetDateTime.now();
        
        if (startTime != null && now.isBefore(startTime)) {
            return ContestState.UPCOMING;
        }
        
        if (endTime != null && now.isAfter(endTime)) {
            return ContestState.FINISHED;
        }
        
        return ContestState.RUNNING;
    }

    /**
     * Check if contest accepts submissions.
     */
    @Transient
    public boolean canSubmit() {
        return getState() == ContestState.RUNNING;
    }
}
