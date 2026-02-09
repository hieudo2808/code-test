package com.example.app.security;

import com.example.app.repository.ProblemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component("security")
@RequiredArgsConstructor
public class SecurityHelper {

    private final ProblemRepository problemRepository;

    public UUID getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            return null;
        }
        return (UUID) auth.getPrincipal();
    }

    public boolean isOwner(UUID resourceOwnerId) {
        UUID currentUserId = getCurrentUserId();
        if (currentUserId == null || resourceOwnerId == null) {
            return false;
        }
        return currentUserId.equals(resourceOwnerId);
    }

    public boolean isProblemOwner(UUID problemId) {
        if (problemId == null) return false;
        UUID currentUserId = getCurrentUserId();
        if (currentUserId == null) return false;
        
        return problemRepository.findById(problemId)
                .map(problem -> problem.getProblemCreator() != null 
                        && currentUserId.equals(problem.getProblemCreator().getUserId()))
                .orElse(false);
    }

    public boolean hasAuthority(String authority) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals(authority));
    }
}
