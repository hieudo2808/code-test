package com.example.app.entity;

import com.example.app.entity.enums.Difficulty;
import com.example.app.entity.enums.EvaluationType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "Problems")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Problem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "problemId")
    UUID problemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problemCreator")
    Users problemCreator;

    @Column(name = "title")
    String title;

    @Column(name = "slug", unique = true)
    String slug;

    @Column(name = "problemDescription", columnDefinition = "NVARCHAR(MAX)")
    String problemDescription;

    @Enumerated(EnumType.STRING)
    @Column(name = "evaluationType", nullable = false)
    EvaluationType evaluationType;

    @Column(name = "timeLimit")
    Double timeLimit;

    @Column(name = "memoryLimit")
    Integer memoryLimit;

    @Enumerated(EnumType.STRING)
    @Column(name = "difficulty")
    Difficulty difficulty;

    @Column(name = "sampleInput", columnDefinition = "NVARCHAR(MAX)")
    String sampleInput;

    @Column(name = "sampleOutput", columnDefinition = "NVARCHAR(MAX)")
    String sampleOutput;

    @Builder.Default
    @Column(name = "isPublic")
    Boolean isPublic = true;

    @Builder.Default
    @Column(name = "maxScore")
    Double maxScore = 100.0;

    // For auto-generate output
    @Column(name = "solutionCode", columnDefinition = "NVARCHAR(MAX)")
    String solutionCode;

    @Column(name = "solutionLanguageId")
    Integer solutionLanguageId;

    // For heuristic judging
    @Column(name = "scorerCode", columnDefinition = "NVARCHAR(MAX)")
    String scorerCode;

    @Column(name = "scorerLanguageId")
    Integer scorerLanguageId;

    @CreationTimestamp
    @Column(name = "createAt", updatable = false)
    OffsetDateTime createAt;

    @UpdateTimestamp
    @Column(name = "updateAt")
    OffsetDateTime updateAt;

    @OneToMany(mappedBy = "problem", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    List<Testcase> testcases = new ArrayList<>();
}
