package com.example.app.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "SystemSettings")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemSettings {
    @Id
    @Column(name = "settingKey", length = 100)
    private String settingKey;

    @Column(name = "settingValue", columnDefinition = "NVARCHAR(MAX)")
    private String settingValue;

    @Column(name = "description", length = 500)
    private String description;

    @UpdateTimestamp
    @Column(name = "updatedAt")
    private OffsetDateTime updatedAt;
}
