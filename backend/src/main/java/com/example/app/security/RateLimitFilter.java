package com.example.app.security;

import com.example.app.dto.ApiResponse;
import com.example.app.exception.ErrorCode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.TimeUnit;
import com.example.app.repository.SystemSettingsRepository;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

@Slf4j
@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {
    private final StringRedisTemplate redisTemplate;
    private final SystemSettingsRepository systemSettingsRepository;
    private static final String RATE_LIMIT_PREFIX = "rate_limit:";
    private static final int AUTH_REQUESTS_PER_MINUTE = 20;
    private static final int DEFAULT_GENERAL_REQUESTS = 200;
    private static final long DEFAULT_WINDOW_SECONDS = 60;

    // Cache settings for 60 seconds
    private final AtomicInteger cachedGeneralLimit = new AtomicInteger(-1);
    private final AtomicLong cachedWindowSeconds = new AtomicLong(-1);
    private final AtomicLong cacheTimestamp = new AtomicLong(0);
    private static final long CACHE_TTL_MS = 60_000;

    private int getGeneralLimit() {
        long now = System.currentTimeMillis();
        if (cachedGeneralLimit.get() != -1 && (now - cacheTimestamp.get()) < CACHE_TTL_MS) {
            return cachedGeneralLimit.get();
        }
        try {
            int limit = systemSettingsRepository.findById("rate.limit.requests")
                    .map(s -> Integer.parseInt(s.getSettingValue()))
                    .orElse(DEFAULT_GENERAL_REQUESTS);
            cachedGeneralLimit.set(limit);
            return limit;
        } catch (Exception e) {
            return DEFAULT_GENERAL_REQUESTS;
        }
    }

    private long getWindowSeconds() {
        long now = System.currentTimeMillis();
        if (cachedWindowSeconds.get() != -1 && (now - cacheTimestamp.get()) < CACHE_TTL_MS) {
            return cachedWindowSeconds.get();
        }
        try {
            long window = systemSettingsRepository.findById("rate.limit.window.seconds")
                    .map(s -> Long.parseLong(s.getSettingValue()))
                    .orElse(DEFAULT_WINDOW_SECONDS);
            cachedWindowSeconds.set(window);
            cacheTimestamp.set(now);
            return window;
        } catch (Exception e) {
            return DEFAULT_WINDOW_SECONDS;
        }
    }

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

        String clientIp = getClientIP(request);
        String path = request.getRequestURI();

        boolean isAuthEndpoint = path.contains("/api/auth") || path.contains("/auth");
        String bucketKey = RATE_LIMIT_PREFIX + clientIp + (isAuthEndpoint ? ":auth" : ":general");
        int limit = isAuthEndpoint ? AUTH_REQUESTS_PER_MINUTE : getGeneralLimit();

        Long currentCount = redisTemplate.opsForValue().increment(bucketKey);
        
        if (currentCount != null && currentCount == 1) {
            redisTemplate.expire(bucketKey, getWindowSeconds(), TimeUnit.SECONDS);
        }

        if (currentCount != null && currentCount > limit) {
            log.warn("Rate limit exceeded for IP: {} on path: {}", clientIp, path);
            response.setStatus(429);
            response.setContentType("application/json");
            ApiResponse<?> apiResponse = ApiResponse.builder()
                    .code(ErrorCode.RATE_LIMITED.getCode())
                    .message(ErrorCode.RATE_LIMITED.getMessage())
                    .build();
            response.getWriter().write(new ObjectMapper().writeValueAsString(apiResponse));
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIP(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
