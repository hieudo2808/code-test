package com.example.app.service.submission;

import com.example.app.entity.Submission;
import com.example.app.entity.enums.SubmissionStatus;
import com.example.app.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Handles MANUAL-mode submissions.
 * No Judge0 interaction — just set NEED_REVIEW and done.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ManualDispatcher {

    private final SubmissionRepository submissionRepository;

    @Transactional
    public void dispatch(Submission submission) {
        submission.setSubmissionStatus(SubmissionStatus.NEED_REVIEW);
        submissionRepository.save(submission);
        log.info("Marked submission {} for manual review", submission.getSubmissionId());
    }
}
