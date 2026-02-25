package com.example.app.controller;

import com.example.app.dto.ApiResponse;
import com.example.app.dto.request.user.AdminUpdateUserRequest;
import com.example.app.dto.request.user.ChangePasswordRequest;
import com.example.app.dto.request.user.CreateUserRequest;
import com.example.app.dto.request.user.UserProfileUpdateRequest;
import com.example.app.dto.response.UserResponse;
import com.example.app.service.UserServices;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {
    private final UserServices userServices;

    // ==================== ADMIN ENDPOINTS ====================

    @PostMapping
    public ApiResponse<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        return ApiResponse.<UserResponse>builder()
                .message("User created successfully. Credentials sent to email.")
                .result(userServices.createUser(request))
                .build();
    }

    @PutMapping("/{userId}")
    public ApiResponse<UserResponse> adminUpdateUser(
            @PathVariable UUID userId,
            @Valid @RequestBody AdminUpdateUserRequest request) {
        return ApiResponse.<UserResponse>builder()
                .message("User updated successfully")
                .result(userServices.adminUpdateUser(userId, request))
                .build();
    }

    @DeleteMapping("/{userId}")
    public ApiResponse<Void> deleteUser(@PathVariable UUID userId) {
        userServices.deleteUser(userId);
        return ApiResponse.<Void>builder()
                .message("User deleted successfully")
                .build();
    }

    @GetMapping("/{userId}")
    public ApiResponse<UserResponse> getUser(@PathVariable UUID userId) {
        return ApiResponse.<UserResponse>builder()
                .result(userServices.getUser(userId))
                .build();
    }

    @GetMapping
    public ApiResponse<List<UserResponse>> getAllUsers() {
        return ApiResponse.<List<UserResponse>>builder()
                .result(userServices.getAllUsers())
                .build();
    }

    // ==================== USER SELF ENDPOINTS ====================

    @GetMapping("/me")
    public ApiResponse<UserResponse> getMyProfile() {
        return ApiResponse.<UserResponse>builder()
                .result(userServices.getMyProfile())
                .build();
    }

    @PutMapping("/me")
    public ApiResponse<UserResponse> updateMyProfile(@Valid @RequestBody UserProfileUpdateRequest request) {
        return ApiResponse.<UserResponse>builder()
                .message("Profile updated successfully")
                .result(userServices.updateMyProfile(request))
                .build();
    }

    @PutMapping("/me/password")
    public ApiResponse<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        userServices.changePassword(request);
        return ApiResponse.<Void>builder()
                .message("Password changed successfully")
                .build();
    }

    @PutMapping("/me/avatar")
    public ApiResponse<String> updateAvatar(@RequestParam("file") MultipartFile file) {
        String avatarUrl = userServices.updateAvatar(file);
        return ApiResponse.<String>builder()
                .message("Avatar updated successfully")
                .result(avatarUrl)
                .build();
    }

    @GetMapping("/{userId}/avatar")
    public ResponseEntity<Resource> getUserAvatar(@PathVariable UUID userId) {
        return userServices.getUserAvatar(userId);
    }
}

