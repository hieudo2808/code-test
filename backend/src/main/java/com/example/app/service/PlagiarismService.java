package com.example.app.service;

import com.example.app.dto.response.PlagiarismResultResponse;
import com.example.app.entity.PlagiarismCheck;
import com.example.app.entity.Submission;
import com.example.app.entity.enums.PlagiarismVerdict;
import com.example.app.entity.enums.Verdict;
import com.example.app.exception.AppException;
import com.example.app.exception.ErrorCode;
import com.example.app.repository.ContestProblemRepository;
import com.example.app.repository.ContestRepository;
import com.example.app.repository.PlagiarismCheckRepository;
import com.example.app.repository.SubmissionRepository;
import com.example.app.util.AstSimilarityUtil;
import com.example.app.util.CodeNormalizer;
import com.example.app.util.WinnowingUtil;
import com.example.app.util.CfgSimilarityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlagiarismService {
    private static final int PAGE_SIZE = 200;
    private static final int BATCH_SAVE_SIZE = 50;
    private static final int MAX_BUCKET_SIZE = 100;

    private final PlagiarismCheckRepository plagiarismRepository;
    private final SubmissionRepository submissionRepository;
    private final ContestRepository contestRepository;
    private final ContestProblemRepository contestProblemRepository;
    private final CodeNormalizer codeNormalizer;
    private final WinnowingUtil winnowingUtil;
    private final AstSimilarityUtil astSimilarityUtil;
    private final CfgSimilarityUtil cfgSimilarityUtil;
    private final TransactionTemplate transactionTemplate;
    private final SystemSettingsService systemSettingsService;

    // Lightweight pair key — avoids String concatenation GC overhead
    private record PairKey(UUID a, UUID b) {
        static PairKey of(UUID id1, UUID id2) {
            return id1.compareTo(id2) < 0 ? new PairKey(id1, id2) : new PairKey(id2, id1);
        }
    }

    @Async("judgeExecutor")
    public void runPlagiarismCheck(UUID contestId, UUID problemId) {
        try {
            log.info("Starting plagiarism check for contest: {} and problem: {}", contestId, problemId);

            if (!contestRepository.existsById(contestId)) {
                throw new AppException(ErrorCode.CONTEST_NOT_FOUND);
            }

            // Preload existing pairs once
            Set<PairKey> existingPairs = plagiarismRepository.findByContestIdAndProblemId(contestId, problemId).stream()
                    .map(c -> PairKey.of(
                            c.getSubmission1().getSubmissionId(),
                            c.getSubmission2().getSubmissionId()))
                    .collect(Collectors.toSet());

            int totalSaved = 0;

            List<Submission> subs = loadProblemSubmissions(contestId, problemId);
            log.info("Problem {}: {} valid submissions to check", problemId, subs.size());

            totalSaved += transactionTemplate.execute(status -> checkWithInvertedIndex(subs, existingPairs));

            // Explicitly release references for GC
            subs.clear();

            log.info("Plagiarism check completed for contest {} and problem {}. Found {} suspicious pairs.",
                    contestId, problemId, totalSaved);

        } catch (Exception e) {
            log.error("Plagiarism check failed for contest {} and problem {}: {}", contestId, problemId, e.getMessage(), e);
        }
    }

    /**
     * Load valid submissions for one problem in pages.
     * Only this problem's data lives in memory at a time.
     */
    private List<Submission> loadProblemSubmissions(UUID contestId, UUID problemId) {
        List<Submission> result = new ArrayList<>();
        int page = 0;
        while (true) {
            Pageable pageable = PageRequest.of(page, PAGE_SIZE);
            Page<Submission> chunk = submissionRepository
                    .findByContestContestIdAndProblemProblemId(contestId, problemId, pageable);

            for (Submission s : chunk.getContent()) {
                if (s.getFinalVerdict() != Verdict.COMPILE_ERROR) {
                    result.add(s);
                }
            }
            if (!chunk.hasNext()) break;
            page++;
        }
        return result;
    }

    /**
     * Inverted-index approach with early pruning.
     * 1. Pre-compute fingerprints (each submission processed once)
     * 2. Build inverted index: hash → submission IDs
     * 3. Count shared fingerprints, prune candidates that can't reach threshold
     * 4. Compute final similarity and batch-save results
     */
    private int checkWithInvertedIndex(List<Submission> submissions, Set<PairKey> existingPairs) {
        int n = submissions.size();
        if (n < 2) return 0;

        // Fetch configs
        int k = systemSettingsService.getSettingAsInt("plagiarism.winnowing.k", 15);
        int w = systemSettingsService.getSettingAsInt("plagiarism.winnowing.w", 5);
        double threshold = systemSettingsService.getSettingAsDouble("plagiarism.threshold", 85.0) / 100.0;
        double pruneFactor = Math.min(0.30, threshold * 0.5); // Prune pairs below 30% or half threshold

        // 1. Pre-compute fingerprints, skip too-short code
        Map<UUID, Set<Long>> fpCache = new LinkedHashMap<>();
        Map<UUID, Submission> subMap = new LinkedHashMap<>();
        
        // BATCH NORMALIZE to eliminate N+1 synchronous network bottlenecks
        Map<UUID, String> normalizedCache = codeNormalizer.normalizeBatch(submissions);

        for (Submission sub : submissions) {
            String normalized = normalizedCache.get(sub.getSubmissionId());
            if (normalized == null || normalized.isEmpty()) continue;

            Set<Long> fp = winnowingUtil.generateFingerprint(normalized, k, w);
            if (fp.size() >= 5) { // Minimal features to consider
                fpCache.put(sub.getSubmissionId(), fp);
                subMap.put(sub.getSubmissionId(), sub);
            }
        }

        if (fpCache.size() < 2) return 0;

        // 2. Build inverted index, skip top-frequent hashes (boilerplate noise)
        Map<Long, List<UUID>> invertedIndex = new HashMap<>();
        for (Map.Entry<UUID, Set<Long>> entry : fpCache.entrySet()) {
            for (Long hash : entry.getValue()) {
                invertedIndex.computeIfAbsent(hash, key -> new ArrayList<>()).add(entry.getKey());
            }
        }

        // 3. Count shared fingerprints per candidate pair with early pruning
        Map<PairKey, Integer> sharedCounts = new HashMap<>();

        for (Map.Entry<Long, List<UUID>> entry : invertedIndex.entrySet()) {
            List<UUID> bucket = entry.getValue();
            if (bucket.size() < 2 || bucket.size() > Math.min(MAX_BUCKET_SIZE, Math.max((int)(fpCache.size() * 0.2), 50))) continue;

            for (int i = 0; i < bucket.size() - 1; i++) {
                for (int j = i + 1; j < bucket.size(); j++) {
                    PairKey key = PairKey.of(bucket.get(i), bucket.get(j));
                    sharedCounts.merge(key, 1, Integer::sum);
                }
            }
        }

        // 4. Evaluate candidates
        List<PlagiarismCheck> batch = new ArrayList<>();
        int savedCount = 0;

        for (Map.Entry<PairKey, Integer> entry : sharedCounts.entrySet()) {
            PairKey key = entry.getKey();
            if (existingPairs.contains(key)) continue;

            int intersection = entry.getValue();
            Set<Long> fp1 = fpCache.get(key.a());
            Set<Long> fp2 = fpCache.get(key.b());
            if (fp1 == null || fp2 == null) continue;

            // Containment bound
            int minSize = Math.min(fp1.size(), fp2.size());
            if (intersection < pruneFactor * minSize) continue;

            // Compute similarity (Jaccard-ish containment)
            double similarity = (double) intersection / minSize;

            if (similarity >= 0.30) { // Keep if > 30% for Phase 2/3 potential
                Submission sub1 = subMap.get(key.a());
                Submission sub2 = subMap.get(key.b());
                if (sub1 == null || sub2 == null) continue;

                // Skip same user
                UUID u1 = sub1.getSubmitter() != null ? sub1.getSubmitter().getUserId() : null;
                UUID u2 = sub2.getSubmitter() != null ? sub2.getSubmitter().getUserId() : null;
                if (u1 != null && u1.equals(u2)) continue;

                String norm1 = normalizedCache.get(key.a());
                String norm2 = normalizedCache.get(key.b());
                PlagiarismResultResponse result = compareCodes(key.a(), key.b(), similarity, norm1, norm2, threshold);

                batch.add(PlagiarismCheck.builder()
                        .submission1(sub1).submission2(sub2)
                        .similarityScore(result.getSimilarity())
                        .lexicalScore(similarity)
                        .astScore(result.getAstScore())
                        .cfgScore(result.getCfgScore())
                        .verdict(result.getVerdict())
                        .build());
                existingPairs.add(key);
                savedCount++;

                log.info("Suspicious pair: {} - {} (lexical: {}, ast: {}, cfg: {}) verdict: {}",
                        key.a(), key.b(), String.format("%.2f", similarity), 
                        String.format("%.2f", result.getAstScore()), 
                        String.format("%.2f", result.getCfgScore()), 
                        result.getVerdict());

                if (batch.size() >= BATCH_SAVE_SIZE) {
                    plagiarismRepository.saveAll(batch);
                    batch.clear();
                }
            }
        }

        if (!batch.isEmpty()) {
            plagiarismRepository.saveAll(batch);
        }
        return savedCount;
    }

    public List<PlagiarismResultResponse> getResults(UUID contestId) {
        return plagiarismRepository.findByContestId(contestId).stream()
                .map(this::toResponse).toList();
    }

    public List<PlagiarismResultResponse> getResultsByProblem(UUID contestId, UUID problemId) {
        return plagiarismRepository.findByContestIdAndProblemId(contestId, problemId).stream()
                .map(this::toResponse).toList();
    }

    private PlagiarismResultResponse toResponse(PlagiarismCheck check) {
        Submission sub1 = check.getSubmission1();
        Submission sub2 = check.getSubmission2();
        return PlagiarismResultResponse.builder()
                .checkId(check.getCheckId())
                .problemId(sub1.getProblem().getProblemId())
                .problemTitle(sub1.getProblem().getTitle())
                .submission1Id(sub1.getSubmissionId())
                .submission2Id(sub2.getSubmissionId())
                .user1Id(sub1.getSubmitter() != null ? sub1.getSubmitter().getUserId() : null)
                .user1Name(sub1.getSubmitter() != null ? sub1.getSubmitter().getFullName() : "Unknown")
                .user2Id(sub2.getSubmitter() != null ? sub2.getSubmitter().getUserId() : null)
                .user2Name(sub2.getSubmitter() != null ? sub2.getSubmitter().getFullName() : "Unknown")
                .similarity(check.getSimilarityScore())
                .lexicalScore(check.getLexicalScore())
                .astScore(check.getAstScore())
                .cfgScore(check.getCfgScore())
                .verdict(check.getVerdict())
                .checkedAt(check.getCheckedAt())
                .build();
    }

    /**
     * Reusable public method for evaluating the three layers of similarity logic.
     * Currently primarily used by testing, but cleanly encapsulates the verdict rules.
     */
    public PlagiarismResultResponse compareCodes(UUID submission1Id, UUID submission2Id, double lexicalScore, String norm1, String norm2, double threshold) {
        double astScore = astSimilarityUtil.calculateAstSimilarity(norm1, norm2);
        double cfgScore = cfgSimilarityUtil.calculateCfgSimilarity(norm1, norm2);
        double maxScore = Math.max(lexicalScore, Math.max(astScore, cfgScore));
        
        PlagiarismVerdict verdict;
        if (maxScore >= threshold) {
            verdict = PlagiarismVerdict.PLAGIARIZED;
        } else if (maxScore >= 0.50) {
            verdict = PlagiarismVerdict.SUSPICIOUS;
        } else {
            verdict = PlagiarismVerdict.CLEAN;
        }

        return PlagiarismResultResponse.builder()
                .submission1Id(submission1Id)
                .submission2Id(submission2Id)
                .similarity(maxScore)
                .lexicalScore(lexicalScore)
                .astScore(astScore)
                .cfgScore(cfgScore)
                .verdict(verdict)
                .build();
    }
}
