package com.example.app.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "ContestParticipants")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContestParticipant {

    @EmbeddedId
    private ContestParticipantId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("contestId")
    @JoinColumn(name = "contestId", nullable = false)
    private Contest contest;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("participantId")
    @JoinColumn(name = "participantId", nullable = false)
    private Users participant;

    @CreationTimestamp
    @Column(name = "joinedAt")
    private OffsetDateTime joinedAt;
}
