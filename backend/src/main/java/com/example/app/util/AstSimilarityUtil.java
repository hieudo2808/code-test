package com.example.app.util;

import org.springframework.stereotype.Component;

@Component
public class AstSimilarityUtil {
    public double calculateAstSimilarity(String normalizedCode1, String normalizedCode2) {
        if (normalizedCode1 == null || normalizedCode1.isEmpty() || 
            normalizedCode2 == null || normalizedCode2.isEmpty()) {
            return 0.0;
        }

        String[] tokens1 = normalizedCode1.split("\\s+");
        String[] tokens2 = normalizedCode2.split("\\s+");

        int lcsLength = computeLCS(tokens1, tokens2);
        
        return (2.0 * lcsLength) / (tokens1.length + tokens2.length);
    }

    private int computeLCS(String[] a, String[] b) {
        int m = a.length;
        int n = b.length;

        int[] prevRow = new int[n + 1];
        int[] currRow = new int[n + 1];

        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (a[i - 1].equals(b[j - 1])) {
                    currRow[j] = prevRow[j - 1] + 1;
                } else {
                    currRow[j] = Math.max(prevRow[j], currRow[j - 1]);
                }
            }
            int[] temp = prevRow;
            prevRow = currRow;
            currRow = temp;
        }

        return prevRow[n]; 
    }
}
