package com.example.app.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ContestProblems")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContestProblem {

    @EmbeddedId
    private ContestProblemId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("contestId")
    @JoinColumn(name = "contestId", nullable = false)
    private Contest contest;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("problemId")
    @JoinColumn(name = "problemId", nullable = false)
    private Problem problem;

    @Column(name = "maxSubmissions")
    private Integer maxSubmissions;  // null = unlimited
}
