package com.example.app.service.submission;

import com.example.app.entity.Submission;
import com.example.app.entity.SubmissionResult;
import com.example.app.entity.enums.EvaluationType;
import com.example.app.entity.enums.SubmissionStatus;
import com.example.app.entity.enums.Verdict;
import com.example.app.repository.SubmissionRepository;
import com.example.app.repository.SubmissionResultRepository;
import com.example.app.service.submission.event.JudgeResultReceivedEvent;
import com.example.app.service.submission.event.ManualScoredEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
public class Aggregator {
    private final SubmissionRepository submissionRepository;
    private final SubmissionResultRepository resultRepository;

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onJudgeResult(JudgeResultReceivedEvent event) {
        tryAggregate(event.submissionId());
    }

    @Transactional
    @EventListener
    public void onManualScored(ManualScoredEvent event) {
        tryAggregate(event.submissionId());
    }

    @Transactional
    public void tryAggregate(java.util.UUID submissionId) {
        Submission submission = submissionRepository.findForUpdate(submissionId).orElse(null);
        if (submission == null) return;

        // Already finalized
        if (submission.getSubmissionStatus() == SubmissionStatus.DONE) {
            log.info("[AGGREGATOR] Skipping submission {}: already DONE", submissionId);
            return;
        }

        // Check if all results are in
        long remaining = resultRepository.countUnfinished(submissionId);
        if (remaining > 0) {
            log.info("[AGGREGATOR] Skipping submission {}: {} testcases still have verdict=null", submissionId, remaining);
            return;
        }

        List<SubmissionResult> results = resultRepository.findBySubmissionSubmissionId(submissionId);

        EvaluationType evalType = submission.getProblem().getEvaluationType();
        if (evalType == EvaluationType.HEURISTIC) {
            boolean scoreMissing = results.stream().anyMatch(r -> r.getScore() == null);
            if (scoreMissing) {
                log.info("[AGGREGATOR] Skipping submission {}: HEURISTIC scores not ready yet", submissionId);
                return;
            }
        }

        // Calculate final score (sum of per-testcase scores)
        double totalScore = results.stream()
                .mapToDouble(r -> r.getScore() != null ? r.getScore() : 0)
                .sum();

        // 3-state final verdict
        long acceptedCount = results.stream()
                .map(SubmissionResult::getVerdict)
                .filter(Objects::nonNull)
                .filter(v -> v == Verdict.ACCEPTED)
                .count();

        Verdict finalVerdict;
        if (acceptedCount == results.size()) {
            finalVerdict = Verdict.ACCEPTED;
        } else if (acceptedCount > 0) {
            finalVerdict = Verdict.PARTIAL;
        } else {
            finalVerdict = Verdict.FAILED;
        }

        // Compute aggregate time and memory
        double totalTimeMs = results.stream()
                .mapToDouble(r -> r.getTimeMs() != null ? r.getTimeMs() : 0)
                .sum();
        double peakMemoryKb = results.stream()
                .mapToDouble(r -> r.getMemoryKb() != null ? r.getMemoryKb() : 0)
                .max().orElse(0);

        submission.setFinalScore(totalScore);
        submission.setFinalVerdict(finalVerdict);
        submission.setTotalTimeMs(totalTimeMs);
        submission.setPeakMemoryKb(peakMemoryKb);
        submission.setSubmissionStatus(SubmissionStatus.DONE);
        submissionRepository.save(submission);
    }
}
