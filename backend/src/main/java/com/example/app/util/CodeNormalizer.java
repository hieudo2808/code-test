package com.example.app.util;

import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Utility class for normalizing code before plagiarism comparison.
 */
@Component
public class CodeNormalizer {

    // Common comment patterns
    private static final Pattern SINGLE_LINE_COMMENT = Pattern.compile("//.*$", Pattern.MULTILINE);
    private static final Pattern MULTI_LINE_COMMENT = Pattern.compile("/\\*.*?\\*/", Pattern.DOTALL);
    private static final Pattern PYTHON_SINGLE_COMMENT = Pattern.compile("#.*$", Pattern.MULTILINE);
    private static final Pattern PYTHON_MULTI_COMMENT = Pattern.compile("'''.*?'''|\"\"\".*?\"\"\"", Pattern.DOTALL);
    
    // Whitespace normalization
    private static final Pattern MULTIPLE_SPACES = Pattern.compile("\\s+");
    private static final Pattern EMPTY_LINES = Pattern.compile("(?m)^\\s*$[\r\n]*");

    /**
     * Normalize code by removing comments and normalizing whitespace.
     */
    public String normalize(String code, int languageId) {
        if (code == null || code.isEmpty()) {
            return "";
        }

        String normalized = code;

        // Remove comments based on language
        if (isPythonLike(languageId)) {
            normalized = PYTHON_SINGLE_COMMENT.matcher(normalized).replaceAll("");
            normalized = PYTHON_MULTI_COMMENT.matcher(normalized).replaceAll("");
        } else {
            // C/C++/Java style
            normalized = SINGLE_LINE_COMMENT.matcher(normalized).replaceAll("");
            normalized = MULTI_LINE_COMMENT.matcher(normalized).replaceAll("");
        }

        // Normalize whitespace
        normalized = EMPTY_LINES.matcher(normalized).replaceAll("");
        normalized = MULTIPLE_SPACES.matcher(normalized).replaceAll(" ");
        normalized = normalized.trim().toLowerCase();

        return normalized;
    }

    /**
     * Tokenize normalized code into a set of tokens for Jaccard similarity.
     */
    public Set<String> tokenize(String normalizedCode) {
        if (normalizedCode == null || normalizedCode.isEmpty()) {
            return new HashSet<>();
        }

        // Split on non-alphanumeric characters
        String[] tokens = normalizedCode.split("[^a-zA-Z0-9_]+");
        return new HashSet<>(Arrays.asList(tokens));
    }

    /**
     * Calculate Jaccard similarity between two token sets.
     * @return similarity score between 0.0 and 1.0
     */
    public double calculateJaccardSimilarity(Set<String> tokens1, Set<String> tokens2) {
        if (tokens1.isEmpty() && tokens2.isEmpty()) {
            return 1.0;
        }
        if (tokens1.isEmpty() || tokens2.isEmpty()) {
            return 0.0;
        }

        Set<String> intersection = new HashSet<>(tokens1);
        intersection.retainAll(tokens2);

        Set<String> union = new HashSet<>(tokens1);
        union.addAll(tokens2);

        return (double) intersection.size() / union.size();
    }

    /**
     * Full pipeline: normalize, tokenize, and calculate similarity.
     */
    public double calculateSimilarity(String code1, String code2, int languageId) {
        String normalized1 = normalize(code1, languageId);
        String normalized2 = normalize(code2, languageId);

        Set<String> tokens1 = tokenize(normalized1);
        Set<String> tokens2 = tokenize(normalized2);

        return calculateJaccardSimilarity(tokens1, tokens2);
    }

    private boolean isPythonLike(int languageId) {
        // Judge0 language IDs for Python
        // 70 = Python 2, 71 = Python 3
        return languageId == 70 || languageId == 71;
    }
}
