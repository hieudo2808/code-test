package com.example.app.service.submission;

import com.example.app.entity.Submission;
import com.example.app.entity.enums.SubmissionStatus;
import com.example.app.exception.AppException;
import com.example.app.exception.ErrorCode;
import com.example.app.repository.SubmissionRepository;
import com.example.app.service.submission.event.SubmissionCreatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Entry point of the judging pipeline.
 * Listens for SubmissionCreatedEvent and dispatches to the correct handler
 * based on the problem's evaluation type.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SubmissionOrchestrator {

    private final SubmissionRepository submissionRepository;
    private final ExactDispatcher exactDispatcher;
    private final HeuristicDispatcher heuristicDispatcher;
    private final ManualDispatcher manualDispatcher;

    @Async("judgeExecutor")
    @EventListener
    @Transactional
    public void handleSubmissionCreated(SubmissionCreatedEvent event) {
        log.info("Processing SubmissionCreatedEvent for: {}", event.submissionId());

        Submission submission = submissionRepository.findById(event.submissionId())
                .orElseThrow(() -> new AppException(ErrorCode.SUBMISSION_NOT_FOUND));

        try {
            switch (submission.getProblem().getEvaluationType()) {
                case EXACT -> exactDispatcher.dispatch(submission);
                case HEURISTIC -> heuristicDispatcher.dispatch(submission);
                case MANUAL -> manualDispatcher.dispatch(submission);
            }
        } catch (Exception e) {
            log.error("Orchestrator failed for submission: {}", event.submissionId(), e);
            submission.setSubmissionStatus(SubmissionStatus.ERROR);
            submissionRepository.save(submission);
        }
    }
}
