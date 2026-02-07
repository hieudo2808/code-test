package com.example.app.service;

import com.example.app.entity.Users;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Getter
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CustomUserDetails implements UserDetails {
    UUID userId;
    String email;
    String password;
    boolean active;
    OffsetDateTime lockUntil;
    Set<GrantedAuthority> authorities;

    public CustomUserDetails(Users user) {
        this.userId = user.getUserId();
        this.email = user.getEmail();
        this.password = user.getHashPassword();
        this.active = user.isActive();
        this.lockUntil = user.getLockUntil();
        this.authorities = user.getRole().getPermissions()
                .stream()
                .map(p -> new SimpleGrantedAuthority(p.getPermissionName()))
                .collect(Collectors.toSet());
    }

    @Override public String getUsername() { return email; }
    @Override public String getPassword() { return password; }

    @Override
    public boolean isAccountNonLocked() {
        return lockUntil == null || lockUntil.isBefore(OffsetDateTime.now());
    }

    @Override public boolean isEnabled() { return active; }
    @Override public Collection<? extends GrantedAuthority> getAuthorities() { return authorities; }
}
