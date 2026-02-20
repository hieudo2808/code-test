package com.example.app.service.submission.event;

import java.util.UUID;

/**
 * Fired when a heuristic submission's user-code run succeeds (ACCEPTED)
 * and the scorer needs to be invoked for that testcase.
 */
public record ScoringRequiredEvent(UUID submissionId, UUID submissionResultId) {}
