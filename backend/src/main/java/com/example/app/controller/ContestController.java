package com.example.app.controller;

import com.example.app.dto.ApiResponse;
import com.example.app.dto.request.contest.AddContestProblemRequest;
import com.example.app.dto.request.contest.CreateContestRequest;
import com.example.app.dto.request.contest.UpdateContestRequest;
import com.example.app.dto.response.ContestParticipantResponse;
import com.example.app.dto.response.ContestProblemResponse;
import com.example.app.dto.response.ContestResponse;
import com.example.app.dto.response.PlagiarismResultResponse;
import com.example.app.service.ContestService;
import com.example.app.service.PlagiarismService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/contests")
@RequiredArgsConstructor
public class ContestController {

    private final ContestService contestService;
    private final PlagiarismService plagiarismService;

    // ==================== CRUD ====================

    @PostMapping
    public ApiResponse<ContestResponse> createContest(@Valid @RequestBody CreateContestRequest request) {
        return ApiResponse.<ContestResponse>builder()
                .message("Contest created successfully")
                .result(contestService.createContest(request))
                .build();
    }

    @GetMapping("/{contestId}")
    public ApiResponse<ContestResponse> getContest(@PathVariable UUID contestId) {
        return ApiResponse.<ContestResponse>builder()
                .result(contestService.getContest(contestId))
                .build();
    }

    @PutMapping("/{contestId}")
    public ApiResponse<ContestResponse> updateContest(
            @PathVariable UUID contestId,
            @RequestBody UpdateContestRequest request) {
        return ApiResponse.<ContestResponse>builder()
                .message("Contest updated successfully")
                .result(contestService.updateContest(contestId, request))
                .build();
    }

    @DeleteMapping("/{contestId}")
    public ApiResponse<Void> deleteContest(@PathVariable UUID contestId) {
        contestService.deleteContest(contestId);
        return ApiResponse.<Void>builder()
                .message("Contest deleted successfully")
                .build();
    }

    @GetMapping
    public ApiResponse<Page<ContestResponse>> listContests(
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.<Page<ContestResponse>>builder()
                .result(contestService.listContests(pageable))
                .build();
    }

    // ==================== PROBLEMS ====================

    @PostMapping("/{contestId}/problems")
    public ApiResponse<ContestProblemResponse> addProblem(
            @PathVariable UUID contestId,
            @Valid @RequestBody AddContestProblemRequest request) {
        return ApiResponse.<ContestProblemResponse>builder()
                .message("Problem added to contest")
                .result(contestService.addProblem(contestId, request))
                .build();
    }

    @DeleteMapping("/{contestId}/problems/{problemId}")
    public ApiResponse<Void> removeProblem(
            @PathVariable UUID contestId,
            @PathVariable UUID problemId) {
        contestService.removeProblem(contestId, problemId);
        return ApiResponse.<Void>builder()
                .message("Problem removed from contest")
                .build();
    }

    @GetMapping("/{contestId}/problems")
    public ApiResponse<List<ContestProblemResponse>> getProblems(@PathVariable UUID contestId) {
        return ApiResponse.<List<ContestProblemResponse>>builder()
                .result(contestService.getProblems(contestId))
                .build();
    }

    // ==================== PARTICIPATION ====================

    @PostMapping("/{contestId}/join")
    public ApiResponse<Void> joinContest(@PathVariable UUID contestId) {
        contestService.joinContest(contestId);
        return ApiResponse.<Void>builder()
                .message("Successfully joined contest")
                .build();
    }

    @GetMapping("/{contestId}/participants")
    public ApiResponse<List<ContestParticipantResponse>> getParticipants(@PathVariable UUID contestId) {
        return ApiResponse.<List<ContestParticipantResponse>>builder()
                .result(contestService.getParticipants(contestId))
                .build();
    }

    // ==================== PLAGIARISM ====================

    @PostMapping("/{contestId}/plagiarism-check")
    public ApiResponse<Void> triggerPlagiarismCheck(@PathVariable UUID contestId) {
        plagiarismService.runPlagiarismCheck(contestId);
        return ApiResponse.<Void>builder()
                .message("Plagiarism check started. Results will be available shortly.")
                .build();
    }

    @GetMapping("/{contestId}/plagiarism")
    public ApiResponse<List<PlagiarismResultResponse>> getPlagiarismResults(@PathVariable UUID contestId) {
        return ApiResponse.<List<PlagiarismResultResponse>>builder()
                .result(plagiarismService.getResults(contestId))
                .build();
    }

    @GetMapping("/{contestId}/plagiarism/problem/{problemId}")
    public ApiResponse<List<PlagiarismResultResponse>> getPlagiarismResultsByProblem(
            @PathVariable UUID contestId,
            @PathVariable UUID problemId) {
        return ApiResponse.<List<PlagiarismResultResponse>>builder()
                .result(plagiarismService.getResultsByProblem(contestId, problemId))
                .build();
    }
}
