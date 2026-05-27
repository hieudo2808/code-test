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
import org.springframework.beans.factory.InitializingBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Entry point of the judging pipeline.
 * Listens for SubmissionCreatedEvent and dispatches to the correct handler
 * based on the problem's evaluation type.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SubmissionOrchestrator implements InitializingBean {

    private final SubmissionRepository submissionRepository;
    private final SubmissionDispatcher submissionDispatcher;
    private final ManualDispatcher manualDispatcher;
    private final PlatformTransactionManager transactionManager;
    private TransactionTemplate transactionTemplate;

    @Override
    public void afterPropertiesSet() {
        this.transactionTemplate = new TransactionTemplate(transactionManager);
        this.transactionTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    @Async("judgeExecutor")
    @EventListener
    public void handleSubmissionCreated(SubmissionCreatedEvent event) {
        log.info("Processing SubmissionCreatedEvent for: {}", event.submissionId());

        Submission submission;
        try {
            submission = transactionTemplate.execute(status -> {
                Submission sub = submissionRepository.findById(event.submissionId())
                        .orElseThrow(() -> new AppException(ErrorCode.SUBMISSION_NOT_FOUND));
                // Force lazy load of problem to avoid LazyInitializationException outside the TX
                if (sub.getProblem() != null) {
                    sub.getProblem().getEvaluationType();
                }
                return sub;
            });
        } catch (Exception e) {
            log.error("Failed to fetch submission in orchestrator: {}", event.submissionId(), e);
            return;
        }

        try {
            switch (submission.getProblem().getEvaluationType()) {
                case EXACT, HEURISTIC -> submissionDispatcher.dispatch(submission);
                case MANUAL -> manualDispatcher.dispatch(submission);
            }
        } catch (Exception e) {
            log.error("Orchestrator failed for submission: {}", event.submissionId(), e);
            transactionTemplate.executeWithoutResult(status -> {
                submissionRepository.findById(event.submissionId()).ifPresent(s -> {
                    s.setSubmissionStatus(SubmissionStatus.ERROR);
                    submissionRepository.save(s);
                });
            });
        }
    }
}
