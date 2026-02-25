package com.example.app.util;

import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

@Component
public class WinnowingUtil {
    private static final long BASE = 257L;
    private static final long MOD = 1_000_000_007L;

    public Set<Long> generateFingerprint(String normalizedCode, int kGramSize, int windowSize) {
        Set<Long> fingerprints = new HashSet<>();
        if (normalizedCode == null || normalizedCode.length() < kGramSize) {
            return fingerprints;
        }

        long[] hashes = computeRollingHashes(normalizedCode, kGramSize);
        if (hashes.length < windowSize) {
            for (long h : hashes) fingerprints.add(h);
            return fingerprints;
        }

        // Winnowing: rightmost minimum in each window, track position
        int lastMinPos = -1;
        int numWindows = hashes.length - windowSize + 1;
        for (int i = 0; i < numWindows; i++) {
            int minPos = i;
            for (int j = i + 1; j < i + windowSize; j++) {
                if (hashes[j] <= hashes[minPos]) {
                    minPos = j;
                }
            }
            if (minPos != lastMinPos) {
                fingerprints.add(hashes[minPos]);
                lastMinPos = minPos;
            }
        }
        return fingerprints;
    }

    private long[] computeRollingHashes(String text, int kGramSize) {
        int n = text.length();
        int count = n - kGramSize + 1;
        long[] hashes = new long[count];

        long basePow = 1;
        for (int i = 0; i < kGramSize - 1; i++) {
            basePow = (basePow * BASE) % MOD;
        }

        long hash = 0;
        for (int i = 0; i < kGramSize; i++) {
            hash = (hash * BASE + text.charAt(i)) % MOD;
        }
        hashes[0] = hash;

        for (int i = 1; i < count; i++) {
            long toRemove = (text.charAt(i - 1) * basePow) % MOD;
            hash = ((hash - toRemove + MOD) % MOD * BASE + text.charAt(i + kGramSize - 1)) % MOD;
            hashes[i] = hash;
        }
        return hashes;
    }

    public double calculateSimilarity(Set<Long> fp1, Set<Long> fp2) {
        if (fp1.isEmpty() || fp2.isEmpty()) return 0.0;

        Set<Long> intersection = new HashSet<>(fp1);
        intersection.retainAll(fp2);

        int minSize = Math.min(fp1.size(), fp2.size());
        
        return (double) intersection.size() / minSize;
    }
}
