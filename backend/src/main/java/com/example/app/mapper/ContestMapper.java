package com.example.app.mapper;

import com.example.app.dto.response.ContestParticipantResponse;
import com.example.app.dto.response.ContestProblemResponse;
import com.example.app.dto.response.ContestResponse;
import com.example.app.entity.Contest;
import com.example.app.entity.ContestParticipant;
import com.example.app.entity.ContestProblem;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class ContestMapper {

    public ContestResponse toResponse(Contest contest, UUID currentUserId, boolean isJoined) {
        return ContestResponse.builder()
                .contestId(contest.getContestId())
                .contestName(contest.getContestName())
                .state(contest.getState())
                .startTime(contest.getStartTime())
                .endTime(contest.getEndTime())
                .isPublic(contest.getIsPublic())
                .problemCount(contest.getContestProblems() != null ? contest.getContestProblems().size() : 0)
                .participantCount(contest.getParticipants() != null ? contest.getParticipants().size() : 0)
                .isJoined(isJoined)
                .ownerId(contest.getContestOwner() != null ? contest.getContestOwner().getUserId() : null)
                .ownerName(contest.getContestOwner() != null ? contest.getContestOwner().getFullName() : null)
                .createdAt(contest.getCreateAt())
                .build();
    }

    public ContestProblemResponse toProblemResponse(ContestProblem cp, Integer userSubmissions) {
        return ContestProblemResponse.builder()
                .problemId(cp.getProblem().getProblemId())
                .title(cp.getProblem().getTitle())
                .slug(cp.getProblem().getSlug())
                .difficulty(cp.getProblem().getDifficulty() != null ? cp.getProblem().getDifficulty().name() : null)
                .maxScore(cp.getProblem().getMaxScore())
                .maxSubmissions(cp.getMaxSubmissions())
                .userSubmissions(userSubmissions)
                .build();
    }

    public ContestParticipantResponse toParticipantResponse(ContestParticipant cp) {
        return ContestParticipantResponse.builder()
                .participantId(cp.getParticipant().getUserId())
                .fullName(cp.getParticipant().getFullName())
                .joinedAt(cp.getJoinedAt())
                .build();
    }
}
