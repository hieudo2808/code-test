package com.example.app.service;

import com.example.app.dto.request.user.AdminUpdateUserRequest;
import com.example.app.dto.request.user.ChangePasswordRequest;
import com.example.app.dto.request.user.CreateUserRequest;
import com.example.app.dto.request.user.UserProfileUpdateRequest;
import com.example.app.dto.response.UserResponse;
import com.example.app.entity.Roles;
import com.example.app.entity.Users;
import com.example.app.exception.AppException;
import com.example.app.exception.ErrorCode;
import com.example.app.helpers.PasswordGenerator;
import com.example.app.mapper.UserMapper;
import com.example.app.repository.RoleRepository;
import com.example.app.repository.UserRepository;
import com.example.app.security.SecurityHelper;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServices {
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final SecurityHelper securityHelper;
    private final S3StorageService s3StorageService;

    // ==================== ADMIN OPERATIONS ====================

    @Transactional
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        Users user = userMapper.toUser(request);
        Roles role = roleRepository.findByRoleName(request.getRoleName())
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
        user.setRole(role);
        user.setActive(true);
        
        String plainPassword = PasswordGenerator.generate(12);
        user.setHashPassword(passwordEncoder.encode(plainPassword));
        
        Users savedUser = userRepository.save(user);
        emailService.sendAccountCreatedEmail(request.getEmail(), plainPassword);

        log.info("Created new user: {}", savedUser.getEmail());
        return enrichUserResponse(userMapper.toUserResponse(savedUser));
    }

    @Transactional
    @PreAuthorize("hasAuthority('USER_MANAGE')")
    public UserResponse adminUpdateUser(UUID userId, AdminUpdateUserRequest request) {
        Users user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        userMapper.updateFromAdmin(request, user);

        if (request.getRoleName() != null && !request.getRoleName().equals(user.getRole().getRoleName())) {
            Roles newRole = roleRepository.findByRoleName(request.getRoleName())
                    .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
            user.setRole(newRole);
        }

        if (request.getIsActive() != null) {
            user.setActive(request.getIsActive());
        }
        
        log.info("Admin updated user: {}", user.getEmail());
        return enrichUserResponse(userMapper.toUserResponse(userRepository.save(user)));
    }

    @PreAuthorize("hasAuthority('USER_MANAGE')")
    public void deleteUser(UUID id) {
        if (!userRepository.existsById(id)) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }
        userRepository.deleteById(id);
        log.info("Deleted user: {}", id);
    }

    @PreAuthorize("hasAuthority('USER_MANAGE')")
    public UserResponse getUser(UUID id) {
        Users user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return enrichUserResponse(userMapper.toUserResponse(user));
    }

    @PreAuthorize("hasAuthority('USER_MANAGE')")
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream().map(user -> enrichUserResponse(userMapper.toUserResponse(user)))
                .toList();
    }

    // ==================== USER SELF OPERATIONS ====================

    @PreAuthorize("hasAuthority('USER_UPDATE_SELF')")
    public UserResponse getMyProfile() {
        UUID userId = securityHelper.getCurrentUserId();
        Users user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return enrichUserResponse(userMapper.toUserResponse(user));
    }

    @Transactional
    @PreAuthorize("hasAuthority('USER_UPDATE_SELF')")
    public UserResponse updateMyProfile(UserProfileUpdateRequest request) {
        UUID userId = securityHelper.getCurrentUserId();
        Users user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        userMapper.updateProfile(request, user);
        
        log.info("User updated profile: {}", user.getEmail());
        return enrichUserResponse(userMapper.toUserResponse(userRepository.save(user)));
    }

    @Transactional
    @PreAuthorize("hasAuthority('USER_UPDATE_SELF')")
    public void changePassword(ChangePasswordRequest request) {
        UUID userId = securityHelper.getCurrentUserId();
        Users user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getHashPassword())) {
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }

        user.setHashPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        
        log.info("User changed password: {}", user.getEmail());
    }

    @Transactional
    @PreAuthorize("hasAuthority('USER_UPDATE_SELF')")
    public String updateAvatar(org.springframework.web.multipart.MultipartFile file) {
        UUID userId = securityHelper.getCurrentUserId();
        Users user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        try {
            String avatarUrl = s3StorageService.uploadAvatar(
                    userId,
                    file.getOriginalFilename(),
                    file.getInputStream(),
                    file.getSize(),
                    file.getContentType()
            );
            user.setAvatarUrl(avatarUrl);
            userRepository.save(user);
            log.info("User updated avatar: {}", user.getEmail());
            return ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/api/users/")
                    .path(userId.toString())
                    .path("/avatar")
                    .toUriString();
        } catch (java.io.IOException e) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    private UserResponse enrichUserResponse(UserResponse response) {
        String avatarUrl = response.getAvatarUrl();
        if (avatarUrl != null && !avatarUrl.isEmpty() && !avatarUrl.startsWith("http")) {
            try {
                String fullUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
                        .path("/api/users/")
                        .path(response.getUserId().toString())
                        .path("/avatar")
                        .toUriString();
                response.setAvatarUrl(fullUrl);
            } catch (Exception e) {
                // Background jobs fallback
                response.setAvatarUrl("/api/users/" + response.getUserId() + "/avatar");
            }
        }
        return response;
    }

    @Transactional(readOnly = true)
    public ResponseEntity<Resource> getUserAvatar(UUID userId) {
        Users user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        String avatarPath = user.getAvatarUrl();
        if (avatarPath == null || avatarPath.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        try {
            java.io.InputStream inputStream = s3StorageService.getFile(avatarPath);
            Resource resource = new InputStreamResource(inputStream);

            MediaType mediaType = MediaType.IMAGE_JPEG;
            if (avatarPath.toLowerCase().endsWith(".png")) {
                mediaType = org.springframework.http.MediaType.IMAGE_PNG;
            } else if (avatarPath.toLowerCase().endsWith(".gif")) {
                mediaType = org.springframework.http.MediaType.IMAGE_GIF;
            } else if (avatarPath.toLowerCase().endsWith(".webp")) {
                mediaType = org.springframework.http.MediaType.parseMediaType("image/webp");
            }

            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .cacheControl(CacheControl.maxAge(30, TimeUnit.DAYS).cachePublic())
                    .body(resource);
        } catch (Exception e) {
            log.warn("Could not fetch avatar for user {}: {}", userId, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
}
