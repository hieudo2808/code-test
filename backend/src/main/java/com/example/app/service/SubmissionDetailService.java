package com.example.app.service;

import com.example.app.dto.response.TestcaseDetailResponse;
import com.example.app.entity.Submission;
import com.example.app.entity.SubmissionResult;
import com.example.app.exception.AppException;
import com.example.app.exception.ErrorCode;
import com.example.app.repository.SubmissionRepository;
import com.example.app.repository.SubmissionResultRepository;
import com.example.app.security.SecurityHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.util.Base64;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubmissionDetailService {

    private final SubmissionRepository submissionRepository;
    private final SubmissionResultRepository resultRepository;
    private final R2StorageService storageService;
    private final SecurityHelper securityHelper;

    @PreAuthorize("hasAuthority('SUBMISSION_READ_SELF') or hasAuthority('SUBMISSION_READ_ALL')")
    public TestcaseDetailResponse getTestcaseDetail(UUID submissionId, UUID testcaseId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new AppException(ErrorCode.SUBMISSION_NOT_FOUND));

        boolean canViewAll = securityHelper.hasAuthority("SUBMISSION_READ_ALL");
        boolean isOwner = isSubmissionOwner(submission);

        if (!canViewAll && !isOwner) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        SubmissionResult result = resultRepository.findBySubmissionSubmissionId(submissionId).stream()
                .filter(r -> r.getTestcase().getTestcaseId().equals(testcaseId))
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.SUBMISSION_NOT_FOUND));

        if (result.getTestcase().getIsHidden() && !canViewAll) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        String input = tryDecodeBase64(storageService.readAsString(result.getTestcase().getInputPath()).trim());
        String expectedOutput = tryDecodeBase64(storageService.readAsString(result.getTestcase().getOutputPath()).trim());

        String userOutputPath = String.format("submissions/%s/results/%s/output.txt",
                submissionId, testcaseId);
        String actualOutput = tryDecodeBase64(storageService.readAsString(userOutputPath).trim());

        return TestcaseDetailResponse.builder()
                .input(input)
                .expectedOutput(expectedOutput)
                .actualOutput(actualOutput)
                .build();
    }

    private String tryDecodeBase64(String value) {
        if (value == null || value.isEmpty()) return value;
        try {
            if (!value.contains(" ") && !value.contains("\n") && value.matches("^[A-Za-z0-9+/=]+$")) {
                return new String(Base64.getDecoder().decode(value));
            }
        } catch (IllegalArgumentException ignored) {
        }
        return value;
    }

    private boolean isSubmissionOwner(Submission submission) {
        UUID currentUserId = securityHelper.getCurrentUserId();
        return currentUserId != null &&
               submission.getSubmitter() != null &&
               currentUserId.equals(submission.getSubmitter().getUserId());
    }
}
