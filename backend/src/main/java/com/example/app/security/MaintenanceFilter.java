package com.example.app.security;

import com.example.app.repository.SystemSettingsRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;

@Slf4j
@Component
@RequiredArgsConstructor
public class MaintenanceFilter extends OncePerRequestFilter {

    private final SystemSettingsRepository systemSettingsRepository;
    private final ObjectMapper objectMapper;

    // Cache maintenance mode value for 30 seconds to avoid DB hit on every request
    private final AtomicReference<Boolean> cachedMaintenanceMode = new AtomicReference<>(null);
    private final AtomicLong cacheTimestamp = new AtomicLong(0);
    private static final long CACHE_TTL_MS = 5_000;

    // Paths that should always be allowed (auth, health, admin settings, actuator, websocket)
    private static final String[] BYPASS_PREFIXES = {
            "/api/auth/",
            "/api/checkstatus",
            "/api/admin/settings",
            "/api/maintenance/status",
            "/actuator",
            "/ws"
    };

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        // Always allow bypass paths
        String path = request.getRequestURI();
        for (String prefix : BYPASS_PREFIXES) {
            if (path.startsWith(prefix)) {
                filterChain.doFilter(request, response);
                return;
            }
        }

        // Check if maintenance mode is enabled
        if (!isMaintenanceMode()) {
            filterChain.doFilter(request, response);
            return;
        }

        // Allow admin users through
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            boolean isAdmin = auth.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .anyMatch("SYSTEM_CONFIG"::equals);
            if (isAdmin) {
                filterChain.doFilter(request, response);
                return;
            }
        }

        // Block non-admin users with 503
        response.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
        response.setContentType("application/json");
        response.getWriter().write(objectMapper.writeValueAsString(Map.of(
                "code", 5003,
                "message", "System is under maintenance. Please try again later."
        )));
    }

    private boolean isMaintenanceMode() {
        long now = System.currentTimeMillis();
        Boolean cached = cachedMaintenanceMode.get();
        if (cached != null && (now - cacheTimestamp.get()) < CACHE_TTL_MS) {
            return cached;
        }

        try {
            boolean enabled = systemSettingsRepository.findById("maintenance.mode")
                    .map(s -> "true".equalsIgnoreCase(s.getSettingValue()))
                    .orElse(false);
            cachedMaintenanceMode.set(enabled);
            cacheTimestamp.set(now);
            return enabled;
        } catch (Exception e) {
            log.warn("Failed to check maintenance mode, defaulting to disabled: {}", e.getMessage());
            return false;
        }
    }
}
