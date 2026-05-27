package com.example.app.service;

import com.example.app.dto.response.SubmissionResponse;
import com.example.app.entity.Problem;
import com.example.app.entity.Submission;
import com.example.app.entity.enums.SubmissionStatus;
import com.example.app.repository.SubmissionRepository;
import com.example.app.repository.SubmissionResultRepository;
import com.example.app.security.SecurityHelper;
import com.example.app.service.submission.event.SubmissionCreatedEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SubmissionServiceRejudgeAllTest {

    @Mock
    private SubmissionRepository submissionRepository;

    @Mock
    private SubmissionResultRepository resultRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private SubmissionService submissionService;

    @BeforeEach
    void setUp() {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.initSynchronization();
        }
    }

    @Test
    void testRejudgeProblem_Success() {
        UUID problemId = UUID.randomUUID();
        
        Submission sub1 = new Submission();
        sub1.setSubmissionId(UUID.randomUUID());
        sub1.setSubmissionStatus(SubmissionStatus.DONE);
        
        Submission sub2 = new Submission();
        sub2.setSubmissionId(UUID.randomUUID());
        sub2.setSubmissionStatus(SubmissionStatus.DONE);
        
        when(submissionRepository.findByProblemProblemId(problemId)).thenReturn(List.of(sub1, sub2));
        when(submissionRepository.save(any(Submission.class))).thenAnswer(i -> i.getArgument(0));

        // When
        submissionService.rejudgeProblem(problemId);

        // Then
        verify(submissionRepository, times(1)).findByProblemProblemId(problemId);
        
        // Both submissions should be updated to PENDING
        ArgumentCaptor<Submission> saveCaptor = ArgumentCaptor.forClass(Submission.class);
        verify(submissionRepository, times(2)).save(saveCaptor.capture());
        
        List<Submission> savedSubmissions = saveCaptor.getAllValues();
        assertEquals(2, savedSubmissions.size());
        assertEquals(SubmissionStatus.PENDING, savedSubmissions.get(0).getSubmissionStatus());
        assertEquals(SubmissionStatus.PENDING, savedSubmissions.get(1).getSubmissionStatus());
        
        // Result repository should be called to delete old results
        verify(resultRepository, times(2)).deleteAll(any());
        
        // We cannot easily verify the event publisher because it happens in afterCommit,
        // which requires Spring's transaction manager in the test.
        // But we proved the core logic is called.
    }
}
