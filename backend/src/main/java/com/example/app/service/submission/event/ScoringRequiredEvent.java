package com.example.app.service.submission.event;

import java.util.UUID;

public record ScoringRequiredEvent(UUID submissionId, UUID submissionResultId) {}
