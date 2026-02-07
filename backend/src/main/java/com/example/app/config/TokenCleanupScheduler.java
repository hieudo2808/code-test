package com.example.app.config;

import com.example.app.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class TokenCleanupScheduler {
    private final RefreshTokenRepository refreshTokenRepository;

    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void cleanupExpiredTokens() {
        int deletedCount = refreshTokenRepository.deleteTokens(OffsetDateTime.now());
        if (deletedCount > 0) {
            log.info("Cleaned up {} expired/revoked refresh tokens", deletedCount);
        }
    }
}
