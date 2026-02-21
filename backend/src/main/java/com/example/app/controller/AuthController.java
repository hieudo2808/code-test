package com.example.app.controller;

import com.example.app.dto.ApiResponse;
import com.example.app.dto.request.auth.LoginRequest;
import com.example.app.dto.request.auth.RegisterRequest;
import com.example.app.dto.response.AuthResponse;
import com.example.app.exception.AppException;
import com.example.app.exception.ErrorCode;
import com.example.app.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private static final String REFRESH_TOKEN_COOKIE = "refresh_token";

    @Value("${jwt.refresh-expiration}")
    private Long refreshExpirationMs;

    @PostMapping("/register")
    public ApiResponse<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletResponse response) {
        
        AuthResponse authResponse = authService.register(request);
        
        setRefreshTokenCookie(response, authResponse.getRefreshToken());
        authResponse.setRefreshToken(null);
        
        return ApiResponse.<AuthResponse>builder().result(authResponse).build();
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {
        
        AuthResponse authResponse = authService.login(request);
        
        setRefreshTokenCookie(response, authResponse.getRefreshToken());
        authResponse.setRefreshToken(null);
        
        return ApiResponse.<AuthResponse>builder().result(authResponse).build();
    }

    @PostMapping("/refresh")
    public ApiResponse<?> refreshToken(
            @CookieValue(name = REFRESH_TOKEN_COOKIE, required = false) String refreshToken,
            HttpServletResponse response) {
        
        if (refreshToken == null || refreshToken.isEmpty())
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);

        try {
            AuthResponse authResponse = authService.refreshAccessToken(refreshToken);
            
            setRefreshTokenCookie(response, authResponse.getRefreshToken());
            authResponse.setRefreshToken(null);
            
            return ApiResponse.<AuthResponse>builder().result(authResponse).build();
        } catch (Exception e) {
            clearRefreshTokenCookie(response);
            log.error(e.getMessage(), e);
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }
    }

    @PostMapping("/logout")
    public ApiResponse<?> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @CookieValue(name = REFRESH_TOKEN_COOKIE, required = false) String refreshToken,
            HttpServletResponse response) {
        
        String accessToken = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            accessToken = authHeader.substring(7);
        }
        
        try {
            authService.logout(accessToken, refreshToken);
        } catch (Exception e) {
            log.atDebug().log(e.getMessage());
        }
        
        clearRefreshTokenCookie(response);
        return ApiResponse.<Void>builder().message("Logout success").build();
    }

    private void setRefreshTokenCookie(HttpServletResponse response, String token) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_TOKEN_COOKIE, token)
                .httpOnly(true)
                .secure(false) // Set to true in production with HTTPS
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofMillis(refreshExpirationMs))
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearRefreshTokenCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_TOKEN_COOKIE, "")
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ZERO)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
