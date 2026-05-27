package com.example.app.controller;

import com.example.app.dto.ApiResponse;
import com.example.app.dto.request.problem.CreateProblemRequest;
import com.example.app.dto.request.problem.UpdateProblemRequest;
import com.example.app.dto.response.ProblemResponse;
import com.example.app.dto.response.ProblemSummaryResponse;
import com.example.app.service.OutputGeneratorService;
import com.example.app.service.ProblemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/problems")
@RequiredArgsConstructor
public class ProblemController {
    private final ProblemService problemService;
    private final OutputGeneratorService outputGeneratorService;

    @PostMapping
    public ApiResponse<ProblemResponse> createProblem(@Valid @RequestBody CreateProblemRequest request) {
        return ApiResponse.<ProblemResponse>builder()
                .message("Problem created successfully")
                .result(problemService.createProblem(request))
                .build();
    }

    @GetMapping
    public ApiResponse<Page<ProblemSummaryResponse>> getAllProblems(
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.<Page<ProblemSummaryResponse>>builder()
                .result(problemService.getAllProblems(pageable))
                .build();
    }

    @GetMapping("/my")
    public ApiResponse<Page<ProblemSummaryResponse>> getMyProblems(
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.<Page<ProblemSummaryResponse>>builder()
                .result(problemService.getMyProblems(keyword, pageable))
                .build();
    }

    @GetMapping("/slug/{slug}")
    public ApiResponse<ProblemResponse> getProblemBySlug(@PathVariable String slug) {
        return ApiResponse.<ProblemResponse>builder()
                .result(problemService.getProblemBySlug(slug))
                .build();
    }

    @GetMapping("/{problemId}")
    public ApiResponse<ProblemResponse> getProblemById(@PathVariable UUID problemId) {
        return ApiResponse.<ProblemResponse>builder()
                .result(problemService.getProblemById(problemId))
                .build();
    }

    @PutMapping("/{problemId}")
    public ApiResponse<ProblemResponse> updateProblem(
            @PathVariable UUID problemId,
            @Valid @RequestBody UpdateProblemRequest request) {
        return ApiResponse.<ProblemResponse>builder()
                .message("Problem updated successfully")
                .result(problemService.updateProblem(problemId, request))
                .build();
    }

    @DeleteMapping("/{problemId}")
    public ApiResponse<Void> deleteProblem(@PathVariable UUID problemId) {
        problemService.deleteProblem(problemId);
        return ApiResponse.<Void>builder()
                .message("Problem deleted successfully")
                .build();
    }

    /**
     * Generate expected outputs for all testcases by running the solution code.
     * Requires problem to have solutionCode and solutionLanguageId set.
     */
    @PostMapping("/{problemId}/generate-outputs")
    public ApiResponse<Void> generateOutputs(@PathVariable UUID problemId) {
        outputGeneratorService.generateOutputsAsync(problemId);
        return ApiResponse.<Void>builder()
                .message("Output generation triggered successfully")
                .build();
    }
}

