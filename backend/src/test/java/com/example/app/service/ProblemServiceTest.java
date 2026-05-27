package com.example.app.service;

import com.example.app.entity.Problem;
import com.example.app.entity.Users;
import com.example.app.repository.ContestProblemRepository;
import com.example.app.repository.ProblemRepository;
import com.example.app.repository.SubmissionRepository;
import com.example.app.repository.UserRepository;
import com.example.app.mapper.ProblemMapper;
import com.example.app.security.SecurityHelper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class ProblemServiceTest {

    @Mock
    private ProblemRepository problemRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SubmissionRepository submissionRepository;

    @Mock
    private ContestProblemRepository contestProblemRepository;

    @Mock
    private ProblemMapper problemMapper;

    @Mock
    private SecurityHelper securityHelper;

    @InjectMocks
    private ProblemService problemService;

    private Problem problem;
    private Users creator;
    private UUID creatorId;
    private UUID otherUserId;

    @BeforeEach
    void setUp() {
        creatorId = UUID.randomUUID();
        otherUserId = UUID.randomUUID();

        creator = Users.builder()
                .userId(creatorId)
                .build();

        problem = Problem.builder()
                .problemCreator(creator)
                .isPublic(false)
                .build();
    }

    @Test
    void testIsRestrictedForCurrentUser_WhenAdmin_ShouldReturnFalse() {
        when(securityHelper.getCurrentUserId()).thenReturn(otherUserId);
        when(securityHelper.hasAuthority("USER_MANAGE")).thenReturn(true);

        Boolean result = ReflectionTestUtils.invokeMethod(problemService, "isRestrictedForCurrentUser", problem);
        assertFalse(result, "Admin should NOT be restricted from viewing the problem");
    }

    @Test
    void testIsRestrictedForCurrentUser_WhenCreator_ShouldReturnFalse() {
        when(securityHelper.getCurrentUserId()).thenReturn(creatorId);

        Boolean result = ReflectionTestUtils.invokeMethod(problemService, "isRestrictedForCurrentUser", problem);
        assertFalse(result, "Creator should NOT be restricted from viewing the problem");
    }

    @Test
    void testIsRestrictedForCurrentUser_WhenOtherUser_ShouldReturnTrue() {
        when(securityHelper.getCurrentUserId()).thenReturn(otherUserId);
        when(securityHelper.hasAuthority("USER_MANAGE")).thenReturn(false);

        Boolean result = ReflectionTestUtils.invokeMethod(problemService, "isRestrictedForCurrentUser", problem);
        assertTrue(result, "Other users should be restricted from viewing the problem");
    }

    @Test
    void testIsRestrictedForCurrentUser_WhenAnonymous_ShouldReturnTrue() {
        when(securityHelper.getCurrentUserId()).thenReturn(null);

        Boolean result = ReflectionTestUtils.invokeMethod(problemService, "isRestrictedForCurrentUser", problem);
        assertTrue(result, "Anonymous users should be restricted from viewing the problem");
    }
}
