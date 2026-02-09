package com.example.app.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Entity
@Table(name = "Testcases")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Testcase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "testcaseId")
    UUID testcaseId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problemId", nullable = false)
    Problem problem;

    @Column(name = "inputPath", nullable = false, length = 500)
    String inputPath;

    @Column(name = "outputPath", nullable = false, length = 500)
    String outputPath;

    @Column(name = "inputSizeKb")
    Integer inputSizeKb;

    @Column(name = "outputSizeKb")
    Integer outputSizeKb;

    @Column(name = "testcasePoint")
    Double testcasePoint;

    @Builder.Default
    @Column(name = "isHidden")
    Boolean isHidden = false;
}
