package com.example.app.service;

import com.example.app.exception.AppException;
import com.example.app.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class JudgeRateLimiter {

    private final Semaphore semaphore;
    private final long queueTimeoutMs;

    public JudgeRateLimiter(
            @Value("${judge0.rate-limit.max-concurrent:10}") int maxConcurrent,
            @Value("${judge0.rate-limit.queue-timeout-ms:30000}") long queueTimeoutMs) {
        this.semaphore = new Semaphore(maxConcurrent);
        this.queueTimeoutMs = queueTimeoutMs;
        log.info("JudgeRateLimiter initialized with max {} concurrent, timeout {}ms", maxConcurrent, queueTimeoutMs);
    }

    public void acquire() {
        try {
            if (!semaphore.tryAcquire(queueTimeoutMs, TimeUnit.MILLISECONDS)) {
                log.warn("Judge queue full, timeout after {}ms", queueTimeoutMs);
                throw new AppException(ErrorCode.JUDGE_QUEUE_FULL);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new AppException(ErrorCode.JUDGE_QUEUE_FULL);
        }
    }

    public void release() {
        semaphore.release();
    }
}
