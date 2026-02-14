package com.example.app.controller;

import com.example.app.dto.ApiResponse;
import com.example.app.dto.request.submission.SubmitCodeRequest;
import com.example.app.dto.response.SubmissionResponse;
import com.example.app.dto.response.TestcaseDetailResponse;
import com.example.app.service.SubmissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/submissions")
@RequiredArgsConstructor
public class SubmissionController {

    private final SubmissionService submissionService;

    @PostMapping
    public ApiResponse<SubmissionResponse> submit(@Valid @RequestBody SubmitCodeRequest request) {
        return ApiResponse.<SubmissionResponse>builder()
                .message("Code submitted successfully")
                .result(submissionService.submit(request))
                .build();
    }

    @GetMapping("/{submissionId}")
    public ApiResponse<SubmissionResponse> getSubmission(@PathVariable UUID submissionId) {
        return ApiResponse.<SubmissionResponse>builder()
                .result(submissionService.getSubmission(submissionId))
                .build();
    }

    @GetMapping("/me")
    public ApiResponse<Page<SubmissionResponse>> getMySubmissions(
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.<Page<SubmissionResponse>>builder()
                .result(submissionService.getMySubmissions(pageable))
                .build();
    }

    @GetMapping("/me/problem/{problemId}")
    public ApiResponse<Page<SubmissionResponse>> getMySubmissionsByProblem(
            @PathVariable UUID problemId,
            @PageableDefault(size = 5, sort = "createAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.<Page<SubmissionResponse>>builder()
                .result(submissionService.getMySubmissionsByProblem(problemId, pageable))
                .build();
    }

    @GetMapping
    public ApiResponse<Page<SubmissionResponse>> getAllSubmissions(
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.<Page<SubmissionResponse>>builder()
                .result(submissionService.getAllSubmissions(pageable))
                .build();
    }

    @GetMapping("/problem/{problemId}")
    public ApiResponse<Page<SubmissionResponse>> getSubmissionsByProblem(
            @PathVariable UUID problemId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.<Page<SubmissionResponse>>builder()
                .result(submissionService.getSubmissionsByProblem(problemId, pageable))
                .build();
    }

    @GetMapping("/contest/{contestId}")
    public ApiResponse<Page<SubmissionResponse>> searchContestSubmissions(
            @PathVariable UUID contestId,
            @RequestParam(required = false) UUID problemId,
            @RequestParam(required = false) UUID submitterId,
            @RequestParam(required = false) String verdict,
            @PageableDefault(size = 20, sort = "createAt",
                    direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.<Page<SubmissionResponse>>builder()
                .result(submissionService.searchContestSubmissions(
                        contestId, problemId, submitterId, verdict, pageable))
                .build();
    }

    @GetMapping("/problem/{problemId}/search")
    public ApiResponse<Page<SubmissionResponse>> searchProblemSubmissions(
            @PathVariable UUID problemId,
            @RequestParam(required = false) UUID submitterId,
            @RequestParam(required = false) String verdict,
            @PageableDefault(size = 20, sort = "createAt",
                    direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.<Page<SubmissionResponse>>builder()
                .result(submissionService.searchProblemSubmissions(
                        problemId, submitterId, verdict, pageable))
                .build();
    }

    @PostMapping("/{submissionId}/rejudge")
    public ApiResponse<SubmissionResponse> rejudge(@PathVariable UUID submissionId) {
        return ApiResponse.<SubmissionResponse>builder()
                .message("Rejudge triggered successfully")
                .result(submissionService.rejudge(submissionId))
                .build();
    }

    @GetMapping("/{submissionId}/results/{testcaseId}/detail")
    public ApiResponse<TestcaseDetailResponse> getTestcaseDetail(
            @PathVariable UUID submissionId,
            @PathVariable UUID testcaseId) {
        return ApiResponse.<TestcaseDetailResponse>builder()
                .result(submissionService.getTestcaseDetail(submissionId, testcaseId))
                .build();
    }
}
