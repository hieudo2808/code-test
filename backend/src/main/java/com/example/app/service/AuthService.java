package com.example.app.service;

import com.example.app.dto.request.auth.LoginRequest;
import com.example.app.dto.request.auth.RegisterRequest;
import com.example.app.dto.response.AuthResponse;
import com.example.app.dto.response.UserResponse;
import com.example.app.entity.RefreshToken;
import com.example.app.entity.Roles;
import com.example.app.entity.Users;
import com.example.app.exception.AppException;
import com.example.app.exception.ErrorCode;
import com.example.app.mapper.UserMapper;
import com.example.app.repository.RefreshTokenRepository;
import com.example.app.repository.RoleRepository;
import com.example.app.repository.UserRepository;
import com.example.app.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.Base64;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserMapper userMapper;
    private final TokenBlacklistService tokenBlacklistService;

    private static final String DEFAULT_ROLE = "STUDENT";

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        // Get default role
        Roles role = roleRepository.findByRoleName(DEFAULT_ROLE)
                .orElseThrow(() -> new AppException(ErrorCode.DEFAULT_ROLE_NOT_FOUND));

        // Create new user
        Users user = Users.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .hashPassword(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .isActive(true)
                .build();

        user = userRepository.save(user);

        return generateAuthResponse(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (BadCredentialsException e) {
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }

        Users user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (!user.isActive()) {
            throw new AppException(ErrorCode.ACCOUNT_LOCKED);
        }

        return generateAuthResponse(user);
    }

    @Transactional
    public AuthResponse refreshAccessToken(String refreshToken) {
        try {
            String tokenType = jwtUtil.extractClaim(refreshToken, c -> c.get("tokenType", String.class));
            if (!"REFRESH".equals(tokenType)) {
                throw new AppException(ErrorCode.INVALID_TOKEN);
            }
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(ErrorCode.INVALID_TOKEN);
        }

        String tokenHash = hashToken(refreshToken);

        RefreshToken storedToken = refreshTokenRepository.findByHashedToken(tokenHash)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_TOKEN));

        if (storedToken.isRevoked() || storedToken.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new AppException(ErrorCode.INVALID_TOKEN);
        }

        // Revoke old token
        storedToken.setRevoked(true);
        refreshTokenRepository.save(storedToken);

        // Generate new tokens
        return generateAuthResponse(storedToken.getUser());
    }

    @Transactional
    public void logout(String accessToken, String refreshToken) {
        if (accessToken != null && !accessToken.isEmpty()) {
            try {
                String jti = jwtUtil.extractJti(accessToken);
                long expirationMs = jwtUtil.extractExpiration(accessToken).getTime() - System.currentTimeMillis();
                if (expirationMs > 0) {
                    tokenBlacklistService.blacklist(jti, expirationMs);
                }
            } catch (Exception e) {
                log.debug(e.getMessage());
            }
        }
        
        String tokenHash = hashToken(refreshToken);
        refreshTokenRepository.findByHashedToken(tokenHash)
                .ifPresent(token -> {
                    token.setRevoked(true);
                    refreshTokenRepository.save(token);
                });
    }

    private AuthResponse generateAuthResponse(Users user) {
        String accessToken = jwtUtil.generateToken(user);
        String refreshToken = jwtUtil.generateRefreshToken(user);

        // Store refresh token
        RefreshToken tokenEntity = RefreshToken.builder()
                .hashedToken(hashToken(refreshToken))
                .user(user)
                .expiresAt(OffsetDateTime.now().plusSeconds(jwtUtil.getRefreshExpiration() / 1000))
                .isRevoked(false)
                .build();
        refreshTokenRepository.save(tokenEntity);

        return AuthResponse.builder()
                .token(accessToken)
                .refreshToken(refreshToken)
                .user(userMapper.toUserResponse(user))
                .build();
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Failed to hash token", e);
        }
    }
}
