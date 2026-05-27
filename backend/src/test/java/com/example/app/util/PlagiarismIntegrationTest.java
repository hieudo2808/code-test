package com.example.app.util;

import com.example.app.dto.response.PlagiarismResultResponse;
import com.example.app.entity.enums.PlagiarismVerdict;
import com.example.app.service.PlagiarismService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
public class PlagiarismIntegrationTest {

    @Autowired
    private CodeNormalizer codeNormalizer;

    @Autowired
    private WinnowingUtil winnowingUtil;

    @Autowired
    private PlagiarismService plagiarismService;

    @Test
    @org.junit.jupiter.api.Disabled("Requires external plagiarism worker container")
    void testPlagiarismVerdictAndSimilarity() {
        String code1 = """
#include <stdio.h>
#include <math.h>
#include <float.h>

#define MAXN 1005

double distance_xy(double x1, double y1, double x2, double y2) {
    double dx = x1 - x2;
    double dy = y1 - y2;
    return sqrt(dx * dx + dy * dy);
}

int findNearest(int current, int total, double px[], double py[], int used[]) {
    int idx = -1;
    double minDist = DBL_MAX;

    for (int i = 0; i < total; ++i) {
        if (!used[i]) {
            double d = distance_xy(px[current], py[current], px[i], py[i]);
            if (d < minDist) {
                minDist = d;
                idx = i;
            }
        }
    }
    return idx;
}

int main() {
    int n;
    scanf("%d", &n);

    double px[MAXN], py[MAXN];
    for (int i = 0; i < n; ++i) {
        scanf("%lf %lf", &px[i], &py[i]);
    }

    int path[MAXN];
    int used[MAXN] = {0};

    path[0] = 0;
    used[0] = 1;

    int count = 1;
    while (count < n) {
        int currentCity = path[count - 1];
        int nearestCity = findNearest(currentCity, n, px, py, used);
        path[count] = nearestCity;
        used[nearestCity] = 1;
        count++;
    }

    for (int i = 0; i < n; ++i) {
        printf("%d", path[i]);
        if (i != n - 1) printf(" ");
    }
    printf("\\n");

    return 0;
}
""";

        String code2 = """
#include <stdio.h>
#include <math.h>
#include <stdbool.h>

int main() {
    int n;
    scanf("%d", &n);
    
    double x[1001], y[1001];
    for (int i = 0; i < n; i++)
        scanf("%lf %lf", &x[i], &y[i]);
    
    bool visited[1001] = {false};
    int tour[1001];
    tour[0] = 0;
    visited[0] = true;
    
    for (int step = 1; step < n; step++) {
        int cur = tour[step - 1];
        double best = 1e18;
        int next = -1;
        for (int j = 0; j < n; j++) {
            if (!visited[j]) {
                double d = hypot(x[cur] - x[j], y[cur] - y[j]);
                if (d < best) { best = d; next = j; }
            }
        }
        tour[step] = next;
        visited[next] = true;
    }
    
    for (int i = 0; i < n; i++)
        printf("%d%c", tour[i], i < n-1 ? ' ' : '\\n');
    
    return 0;
}
""";

        System.out.println("Running Plagiarism Tree-sitter Test...");
        String norm1 = codeNormalizer.normalize(code1, 50); // C code
        String norm2 = codeNormalizer.normalize(code2, 50);

        Set<Long> fp1 = winnowingUtil.generateFingerprint(norm1, 15, 5);
        Set<Long> fp2 = winnowingUtil.generateFingerprint(norm2, 15, 5);
        double lexicalScore = winnowingUtil.calculateSimilarity(fp1, fp2);

        PlagiarismResultResponse result = plagiarismService.compareCodes(
                UUID.randomUUID(), UUID.randomUUID(), lexicalScore, norm1, norm2, 0.85);

        System.out.println("Final Verdict: " + result.getVerdict());
        System.out.println("Overall Similarity: " + result.getSimilarity());

        assertTrue(result.getSimilarity() > 0.80, "Max Similarity should be exceptionally high for disguised plagiarized code.");
        assertEquals(PlagiarismVerdict.PLAGIARIZED, result.getVerdict(), "The verdict should be PLAGIARIZED");
    }
}
