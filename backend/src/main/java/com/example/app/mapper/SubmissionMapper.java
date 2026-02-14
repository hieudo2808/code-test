package com.example.app.mapper;

import com.example.app.dto.response.SubmissionResponse;
import com.example.app.dto.response.SubmissionResultResponse;
import com.example.app.entity.Contest;
import com.example.app.entity.Submission;
import com.example.app.entity.SubmissionResult;
import com.example.app.entity.enums.SubmissionStatus;
import com.example.app.entity.enums.Verdict;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class SubmissionMapper {

    public SubmissionResponse toResponse(Submission submission) {
        SubmissionStatus status = submission.getSubmissionStatus();
        boolean isDone = status == SubmissionStatus.DONE;

        SubmissionResponse.SubmissionResponseBuilder builder = SubmissionResponse.builder()
                .submissionId(submission.getSubmissionId())
                .problemId(submission.getProblem().getProblemId())
                .problemTitle(submission.getProblem().getTitle())
                .problemSlug(submission.getProblem().getSlug())
                .status(status)
                .submittedAt(submission.getCreateAt())
                .submitterId(submission.getSubmitter() != null ? submission.getSubmitter().getUserId() : null)
                .submitterName(submission.getSubmitter() != null ? submission.getSubmitter().getFullName() : null)
                .languageId(submission.getLanguageId());

        // Add contest info if applicable
        Contest contest = submission.getContest();
        if (contest != null) {
            builder.contestId(contest.getContestId());
        }

        if (isDone) {
            // Show full result
            builder.verdict(submission.getFinalVerdict())
                    .score(submission.getFinalScore())
                    .maxScore(submission.getProblem().getMaxScore())
                    .finishedAt(submission.getUpdateAt());
        } else {
            // Still processing - show max score only
            builder.maxScore(submission.getProblem().getMaxScore());
        }

        return builder.build();
    }

    public SubmissionResponse toResponseWithResults(Submission submission, List<SubmissionResult> results, boolean showHiddenDetails) {
        SubmissionResponse response = toResponse(submission);

        // Include source code and timing in detail view
        response.setSourceCode(submission.getSourceCode());
        response.setTotalTimeMs(submission.getTotalTimeMs());

        // Extract message from first CE/RTE result
        if (submission.getSubmissionStatus() == SubmissionStatus.DONE) {
            Verdict verdict = submission.getFinalVerdict();
            if (verdict == Verdict.COMPILE_ERROR || verdict == Verdict.RUNTIME_ERROR) {
                String message = results.stream()
                        .filter(r -> r.getErrorMessage() != null)
                        .map(SubmissionResult::getErrorMessage)
                        .findFirst()
                        .orElse(null);
                response.setMessage(message);
            }
        }

        response.setResults(results.stream()
                .map(r -> toResultResponse(r, showHiddenDetails))
                .toList());
        return response;
    }

    public SubmissionResultResponse toResultResponse(SubmissionResult result, boolean showHiddenDetails) {
        boolean isHidden = result.getTestcase().getIsHidden();

        return SubmissionResultResponse.builder()
                .testcaseId(result.getTestcase().getTestcaseId())
                .verdict(result.getVerdict())
                .timeMs(result.getTimeMs())
                .memoryKb(result.getMemoryKb())
                .score(result.getScore())
                .maxScore(result.getTestcase().getTestcasePoint())
                .errorMessage(showHiddenDetails || !isHidden ? result.getErrorMessage() : null)
                .isHidden(isHidden)
                .build();
    }
}
