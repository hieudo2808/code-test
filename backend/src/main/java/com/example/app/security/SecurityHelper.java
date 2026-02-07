package com.example.app.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component("security")
public class SecurityHelper {

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
}
