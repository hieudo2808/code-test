package com.example.app.service;

import com.example.app.dto.request.testcase.CreateTestcaseRequest;
import com.example.app.dto.request.testcase.UpdateTestcaseRequest;
import com.example.app.dto.response.TestcaseContentResponse;
import com.example.app.dto.response.TestcaseResponse;
import com.example.app.dto.response.TestcaseSummaryResponse;
import com.example.app.entity.Problem;
import com.example.app.entity.SubmissionResult;
import com.example.app.entity.Testcase;
import com.example.app.exception.AppException;
import com.example.app.exception.ErrorCode;
import com.example.app.mapper.TestcaseMapper;
import com.example.app.repository.ProblemRepository;
import com.example.app.repository.SubmissionResultRepository;
import com.example.app.repository.TestcaseRepository;
import com.example.app.security.SecurityHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TestcaseService {
    private final TestcaseRepository testcaseRepository;
    private final ProblemRepository problemRepository;
    private final SubmissionResultRepository submissionResultRepository;
    private final TestcaseMapper testcaseMapper;
    private final R2StorageService storageService;
    private final SecurityHelper securityHelper;

    // ==================== CREATE ====================

    @Transactional
    @PreAuthorize("hasAuthority('TESTCASE_CREATE')")
    public TestcaseResponse createTestcase(
            UUID problemId, 
            CreateTestcaseRequest request,
            MultipartFile inputFile,
            MultipartFile outputFile) {
        
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new AppException(ErrorCode.PROBLEM_NOT_FOUND));

        // Validate ownership or admin
        if (canManageProblem(problem)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        UUID testcaseId = UUID.randomUUID();
        
        // Upload files to S3
        String inputPath;
        String outputPath;
        try {
            inputPath = storageService.saveTestcaseInput(
                    problemId, testcaseId, 
                    inputFile.getInputStream(), 
                    inputFile.getSize());
            
            outputPath = storageService.saveTestcaseOutput(
                    problemId, testcaseId, 
                    outputFile.getInputStream(), 
                    outputFile.getSize());
        } catch (IOException e) {
            log.error("Failed to upload testcase files", e);
            throw new AppException(ErrorCode.FILE_UPLOAD_FAILED);
        }

        Testcase testcase = Testcase.builder()
                .testcaseId(testcaseId)
                .problem(problem)
                .inputPath(inputPath)
                .outputPath(outputPath)
                .inputSizeKb((int) (inputFile.getSize() / 1024))
                .outputSizeKb((int) (outputFile.getSize() / 1024))
                .testcasePoint(request.getTestcasePoint())
                .isHidden(request.getIsHidden() != null ? request.getIsHidden() : false)
                .build();

        Testcase saved = testcaseRepository.save(testcase);
        syncMaxScore(problem);
        log.info("Created testcase: {} for problem: {}", testcaseId, problemId);

        return testcaseMapper.toResponse(saved);
    }

    // ==================== READ ====================

    @PreAuthorize("hasAuthority('TESTCASE_READ_HIDDEN')")
    public List<TestcaseResponse> getAllTestcases(UUID problemId) {
        if (!problemRepository.existsById(problemId)) {
            throw new AppException(ErrorCode.PROBLEM_NOT_FOUND);
        }
        
        return testcaseRepository.findByProblemProblemId(problemId)
                .stream()
                .map(testcaseMapper::toResponse)
                .toList();
    }

    @PreAuthorize("hasAuthority('PROBLEM_READ')")
    public List<TestcaseSummaryResponse> getVisibleTestcases(UUID problemId) {
        if (!problemRepository.existsById(problemId)) {
            throw new AppException(ErrorCode.PROBLEM_NOT_FOUND);
        }

        return testcaseRepository.findByProblemProblemIdAndIsHiddenFalse(problemId)
                .stream()
                .map(testcaseMapper::toSummary)
                .toList();
    }

    // ==================== UPDATE ====================

    @Transactional
    @PreAuthorize("hasAuthority('TESTCASE_UPDATE')")
    public TestcaseResponse updateTestcase(
            UUID testcaseId, 
            UpdateTestcaseRequest request,
            MultipartFile inputFile,
            MultipartFile outputFile) {
        
        Testcase testcase = testcaseRepository.findById(testcaseId)
                .orElseThrow(() -> new AppException(ErrorCode.TESTCASE_NOT_FOUND));

        Problem problem = testcase.getProblem();
        
        // Validate ownership or admin
        if (canManageProblem(problem)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        // Update score if changing
        if (request.getTestcasePoint() != null) {
            testcase.setTestcasePoint(request.getTestcasePoint());
        }

        if (request.getIsHidden() != null) {
            testcase.setIsHidden(request.getIsHidden());
        }

        // Update files if provided
        try {
            if (inputFile != null && !inputFile.isEmpty()) {
                storageService.delete(testcase.getInputPath());
                String newPath = storageService.saveTestcaseInput(
                        problem.getProblemId(), testcaseId,
                        inputFile.getInputStream(),
                        inputFile.getSize());
                testcase.setInputPath(newPath);
                testcase.setInputSizeKb((int) (inputFile.getSize() / 1024));
            }

            if (outputFile != null && !outputFile.isEmpty()) {
                storageService.delete(testcase.getOutputPath());
                String newPath = storageService.saveTestcaseOutput(
                        problem.getProblemId(), testcaseId,
                        outputFile.getInputStream(),
                        outputFile.getSize());
                testcase.setOutputPath(newPath);
                testcase.setOutputSizeKb((int) (outputFile.getSize() / 1024));
            }
        } catch (IOException e) {
            log.error("Failed to update testcase files", e);
            throw new AppException(ErrorCode.FILE_UPLOAD_FAILED);
        }

        Testcase saved = testcaseRepository.save(testcase);
        syncMaxScore(problem);
        log.info("Updated testcase: {}", testcaseId);

        return testcaseMapper.toResponse(saved);
    }

    // ==================== CONTENT ====================

    @PreAuthorize("hasAuthority('TESTCASE_READ_HIDDEN')")
    public TestcaseContentResponse getTestcaseContent(UUID testcaseId) {
        Testcase testcase = testcaseRepository.findById(testcaseId)
                .orElseThrow(() -> new AppException(ErrorCode.TESTCASE_NOT_FOUND));

        if (canManageProblem(testcase.getProblem())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        String input = storageService.readAsString(testcase.getInputPath());
        String output = storageService.readAsString(testcase.getOutputPath());

        return TestcaseContentResponse.builder()
                .testcaseId(testcase.getTestcaseId())
                .input(input)
                .output(output)
                .build();
    }

    // ==================== DELETE ====================

    @Transactional
    @PreAuthorize("hasAuthority('TESTCASE_DELETE')")
    public void deleteTestcase(UUID testcaseId) {
        Testcase testcase = testcaseRepository.findById(testcaseId)
                .orElseThrow(() -> new AppException(ErrorCode.TESTCASE_NOT_FOUND));

        // Validate ownership or admin
        if (canManageProblem(testcase.getProblem())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        // Delete submission result outputs from S3
        List<SubmissionResult> results = submissionResultRepository.findByTestcaseTestcaseId(testcaseId);
        for (SubmissionResult result : results) {
            if (result.getSubmission() != null) {
                String userOutputPath = String.format("submissions/%s/results/%s/output.txt",
                        result.getSubmission().getSubmissionId(), testcaseId);
                storageService.delete(userOutputPath);
            }
        }

        // Delete files from S3
        storageService.delete(testcase.getInputPath());
        storageService.delete(testcase.getOutputPath());

        submissionResultRepository.deleteByTestcaseTestcaseId(testcaseId);
        testcaseRepository.delete(testcase);
        syncMaxScore(testcase.getProblem());
        log.info("Deleted testcase: {}", testcaseId);
    }

    // ==================== HELPERS ====================

    private void syncMaxScore(Problem problem) {
        Double total = testcaseRepository.sumTestcasePointsByProblemId(problem.getProblemId());
        problem.setMaxScore(total != null ? total : 0.0);
        problemRepository.save(problem);
    }

    private boolean canManageProblem(Problem problem) {
        UUID currentUserId = securityHelper.getCurrentUserId();
        if (currentUserId == null) return true;
        
        if (securityHelper.hasAuthority("USER_MANAGE")) return false;
        
        return problem.getProblemCreator() == null
                || !currentUserId.equals(problem.getProblemCreator().getUserId());
    }
}
