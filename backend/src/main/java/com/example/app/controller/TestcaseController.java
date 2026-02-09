package com.example.app.controller;

import com.example.app.dto.ApiResponse;
import com.example.app.dto.request.testcase.CreateTestcaseRequest;
import com.example.app.dto.request.testcase.UpdateTestcaseRequest;
import com.example.app.dto.response.TestcaseResponse;
import com.example.app.dto.response.TestcaseSummaryResponse;
import com.example.app.service.TestcaseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class TestcaseController {
    private final TestcaseService testcaseService;

    @PostMapping(value = "/problems/{problemId}/testcases", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<TestcaseResponse> createTestcase(
            @PathVariable UUID problemId,
            @Valid @RequestPart("request") CreateTestcaseRequest request,
            @RequestPart("input") MultipartFile inputFile,
            @RequestPart("output") MultipartFile outputFile) {
        return ApiResponse.<TestcaseResponse>builder()
                .message("Testcase created successfully")
                .result(testcaseService.createTestcase(problemId, request, inputFile, outputFile))
                .build();
    }

    @GetMapping("/problems/{problemId}/testcases")
    public ApiResponse<List<TestcaseResponse>> getAllTestcases(@PathVariable UUID problemId) {
        return ApiResponse.<List<TestcaseResponse>>builder()
                .result(testcaseService.getAllTestcases(problemId))
                .build();
    }

    @GetMapping("/problems/{problemId}/testcases/visible")
    public ApiResponse<List<TestcaseSummaryResponse>> getVisibleTestcases(@PathVariable UUID problemId) {
        return ApiResponse.<List<TestcaseSummaryResponse>>builder()
                .result(testcaseService.getVisibleTestcases(problemId))
                .build();
    }

    @PutMapping(value = "/testcases/{testcaseId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<TestcaseResponse> updateTestcase(
            @PathVariable UUID testcaseId,
            @Valid @RequestPart("request") UpdateTestcaseRequest request,
            @RequestPart(value = "input", required = false) MultipartFile inputFile,
            @RequestPart(value = "output", required = false) MultipartFile outputFile) {
        return ApiResponse.<TestcaseResponse>builder()
                .message("Testcase updated successfully")
                .result(testcaseService.updateTestcase(testcaseId, request, inputFile, outputFile))
                .build();
    }

    @DeleteMapping("/testcases/{testcaseId}")
    public ApiResponse<Void> deleteTestcase(@PathVariable UUID testcaseId) {
        testcaseService.deleteTestcase(testcaseId);
        return ApiResponse.<Void>builder()
                .message("Testcase deleted successfully")
                .build();
    }
}
