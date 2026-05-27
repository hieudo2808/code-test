package com.example.app.service;

import io.micrometer.core.instrument.MeterRegistry;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;

import java.util.function.Consumer;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
public class JudgeRateLimiterTest {

    @Mock
    private MeterRegistry meterRegistry;

    @Mock
    private ObjectProvider<MeterRegistry> meterRegistryProvider;

    @Test
    void testInitWithoutMeterRegistry_Success() {
        // Arrange
        doAnswer(invocation -> {
            // Do nothing since provider is empty
            return null;
        }).when(meterRegistryProvider).ifAvailable(any());

        // Act
        JudgeRateLimiter limiter = new JudgeRateLimiter(5, 1000, meterRegistryProvider);

        // Assert
        assertEquals(5, limiter.getAvailablePermits());
        assertEquals(0, limiter.getQueueLength());
    }

    @Test
    void testInitWithMeterRegistry_RegistersGauges() {
        // Arrange
        doAnswer(invocation -> {
            Consumer<MeterRegistry> consumer = invocation.getArgument(0);
            consumer.accept(meterRegistry);
            return null;
        }).when(meterRegistryProvider).ifAvailable(any());

        // Act
        JudgeRateLimiter limiter = new JudgeRateLimiter(5, 1000, meterRegistryProvider);

        // Assert
        assertEquals(5, limiter.getAvailablePermits());

        // Verify gauges registration
        verify(meterRegistry).gauge(eq("judge.limiter.available.permits"), eq(limiter), any());
        verify(meterRegistry).gauge(eq("judge.limiter.max.permits"), eq(5));
        verify(meterRegistry).gauge(eq("judge.limiter.queue.length"), eq(limiter), any());
    }

    @Test
    void testAcquireAndRelease_ChangesPermits() {
        // Arrange
        doAnswer(invocation -> null).when(meterRegistryProvider).ifAvailable(any());
        JudgeRateLimiter limiter = new JudgeRateLimiter(2, 1000, meterRegistryProvider);

        // Act & Assert
        assertEquals(2, limiter.getAvailablePermits());

        limiter.acquire();
        assertEquals(1, limiter.getAvailablePermits());

        limiter.acquire();
        assertEquals(0, limiter.getAvailablePermits());

        // Release
        limiter.release();
        assertEquals(1, limiter.getAvailablePermits());
    }
}
