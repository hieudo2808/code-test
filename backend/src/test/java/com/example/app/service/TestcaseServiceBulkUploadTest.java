package com.example.app.service;

import com.example.app.entity.Problem;
import com.example.app.entity.Testcase;
import com.example.app.exception.AppException;
import com.example.app.repository.ProblemRepository;
import com.example.app.repository.TestcaseRepository;
import com.example.app.security.SecurityHelper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TestcaseServiceBulkUploadTest {

    @Mock
    private TestcaseRepository testcaseRepository;

    @Mock
    private ProblemRepository problemRepository;

    @Mock
    private R2StorageService storageService;

    @Mock
    private SecurityHelper securityHelper;

    @Mock
    private OutputGeneratorService outputGeneratorService;

    @InjectMocks
    private TestcaseService testcaseService;

    @Test
    void testBulkUploadInputs_Success() throws Exception {
        UUID problemId = UUID.randomUUID();
        Problem problem = new Problem();
        problem.setProblemId(problemId);

        when(problemRepository.findById(problemId)).thenReturn(Optional.of(problem));
        when(securityHelper.getCurrentUserId()).thenReturn(UUID.randomUUID());
        // Mock canManageProblem logic in TestcaseService (securityHelper.hasAuthority is not mocked, wait we can just mock canManageProblem if it was visible, but it uses securityHelper)
        // Assume securityHelper.getCurrentUserId() is not equal to creator, but we mock USER_MANAGE=false
        // Actually TestcaseService has canManageProblem returning true if not authorized, throwing FORBIDDEN.
        // Wait, if problem has no creator, and currentUser is not null and no USER_MANAGE, canManageProblem returns true.
        // Let's set the creator to currentUser to make it false (authorized).
        UUID userId = UUID.randomUUID();
        com.example.app.entity.Users creator = new com.example.app.entity.Users();
        creator.setUserId(userId);
        problem.setProblemCreator(creator);
        when(securityHelper.getCurrentUserId()).thenReturn(userId);

        MultipartFile file1 = new MockMultipartFile("files", "test1.in", "text/plain", "1 2".getBytes());
        MultipartFile file2 = new MockMultipartFile("files", "test2.in", "text/plain", "3 4".getBytes());
        List<MultipartFile> files = List.of(file1, file2);

        when(storageService.saveTestcaseInput(eq(problemId), any(UUID.class), any(InputStream.class), anyLong()))
                .thenReturn("path/to/input.in");
        when(storageService.saveTestcaseOutput(eq(problemId), any(UUID.class), any(InputStream.class), anyLong()))
                .thenReturn("path/to/output.out");

        when(testcaseRepository.save(any(Testcase.class))).thenAnswer(i -> i.getArgument(0));

        // When
        testcaseService.bulkUploadInputs(problemId, files);

        // Then
        ArgumentCaptor<Testcase> testcaseCaptor = ArgumentCaptor.forClass(Testcase.class);
        verify(testcaseRepository, times(2)).save(testcaseCaptor.capture());
        
        List<Testcase> savedTestcases = testcaseCaptor.getAllValues();
        assertEquals(2, savedTestcases.size());
        assertEquals(0.0, savedTestcases.get(0).getTestcasePoint());
        assertTrue(savedTestcases.get(0).getIsHidden());
        
        verify(outputGeneratorService, times(1)).generateOutputsAsync(problemId);
    }
}
