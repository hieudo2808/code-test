package com.example.app.config;

import lombok.AllArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@AllArgsConstructor
public class PepperBCryptEncoder implements PasswordEncoder {
    private final BCryptPasswordEncoder passwordEncoder;
    private final String pepper;

    public PepperBCryptEncoder(int strength, String pepper) {
        this.passwordEncoder = new BCryptPasswordEncoder(strength);
        this.pepper = pepper;
    }

    @Override
    public String encode(CharSequence rawPassword) {
        return passwordEncoder.encode(rawPassword + pepper);
    }

    @Override
    public boolean matches(CharSequence rawPassword, String encodedPassword) {
        return passwordEncoder.matches(rawPassword + pepper, encodedPassword);
    }
}
