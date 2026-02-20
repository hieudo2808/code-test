package com.example.app.service.submission.event;

import java.util.UUID;

/**
 * Fired when an instructor manually scores a submission.
 * Triggers aggregation.
 */
public record ManualScoredEvent(UUID submissionId) {}
