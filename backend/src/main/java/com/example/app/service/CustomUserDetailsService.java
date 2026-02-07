package com.example.app.service;

import com.example.app.entity.Users;
import com.example.app.exception.AppException;
import com.example.app.exception.ErrorCode;
import com.example.app.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import static com.example.app.exception.ErrorCode.USER_NOT_FOUND;

@Service
@RequiredArgsConstructor
@Transactional
public class CustomUserDetailsService implements UserDetailsService {
    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) {
        Users user = userRepository.findByEmailWithRoleAndPermissions(email)
                .orElseThrow(() -> new UsernameNotFoundException(USER_NOT_FOUND.getMessage()));
        return new CustomUserDetails(user);
    }
}
