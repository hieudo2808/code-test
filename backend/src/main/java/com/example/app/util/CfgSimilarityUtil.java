package com.example.app.util;

import org.springframework.stereotype.Component;

/**
 * Utility class to heuristically calculate Control Flow Graph (CFG) similarity
 * by extracting control flow metadata from an AST token sequence.
 */
@Component
public class CfgSimilarityUtil {
    /**
     * Calculates the heuristic CFG similarity between two sequences of AST tokens.
     * Computes the distance between Cyclomatic Complexity, Loop Counts, and Node size.
     */
    public double calculateCfgSimilarity(String normalizedCode1, String normalizedCode2) {
        if (normalizedCode1 == null || normalizedCode1.isEmpty() ||
                normalizedCode2 == null || normalizedCode2.isEmpty()) {
            return 0.0;
        }

        int[] metrics1 = extractMetrics(normalizedCode1);
        int[] metrics2 = extractMetrics(normalizedCode2);

        double totalScore = 0.0;
        int weights = 0;

        // Weights: cyclomatic (3), loopCount (2), nodeCount (1)
        totalScore += calcMetricSim(metrics1[0], metrics2[0]) * 3;
        weights += 3;

        totalScore += calcMetricSim(metrics1[1], metrics2[1]) * 2;
        weights += 2;

        totalScore += calcMetricSim(metrics1[2], metrics2[2]) * 1;
        weights += 1;

        return totalScore / weights;
    }

    private double calcMetricSim(int a, int b) {
        int max = Math.max(a, b);
        if (max == 0) return 1.0;
        return 1.0 - ((double) Math.abs(a - b) / max);
    }

    /**
     * Extracts an array of [Cyclomatic Complexity, Loop Count, Node Count]
     * by walking the AST structural tokens.
     */
    private int[] extractMetrics(String normalizedCode) {
        String[] tokens = normalizedCode.split("\\s+");
        int nodeCount = tokens.length;
        int ifCount = 0;
        int loopCount = 0;
        int caseCount = 0;
        int catchCount = 0;

        for (String t : tokens) {
            String token = t.toLowerCase();
            
            // Branching nodes
            if (token.contains("if_") || token.contains("elif")) {
                ifCount++;
            } 
            // Loop nodes
            else if (token.contains("for_") || token.contains("while_") || token.contains("do_")) {
                loopCount++;
            } 
            // Switch case nodes
            else if (token.contains("case")) {
                caseCount++;
            } 
            // Exception catch nodes
            else if (token.contains("catch") || token.contains("except")) {
                catchCount++;
            }
        }

        int cyclomaticComplexity = ifCount + loopCount + caseCount + catchCount + 1;
        return new int[]{cyclomaticComplexity, loopCount, nodeCount};
    }
}
