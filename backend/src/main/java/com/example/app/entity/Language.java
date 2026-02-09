package com.example.app.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Languages")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Language {

    @Id
    @Column(name = "languageId")
    private Integer languageId;  // Judge0 ID

    @Column(name = "name", nullable = false, length = 100)
    private String name;  // "C++ (GCC 9.2)"

    @Column(name = "extension", length = 10)
    private String extension;  // "cpp"

    @Column(name = "monacoLanguage", length = 20)
    private String monacoLanguage;  // "cpp" for Monaco Editor

    @Column(name = "isActive")
    @Builder.Default
    private Boolean isActive = true;
}
