package com.example.app.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;
import java.util.UUID;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class ContestParticipantId implements Serializable {

    @Column(name = "contestId")
    private UUID contestId;

    @Column(name = "participantId")
    private UUID participantId;
}
