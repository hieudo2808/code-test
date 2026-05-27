package com.example.app.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Configuration
@EnableCaching
public class CacheConfig {
    @Bean
    public CaffeineCacheManager cacheManager() {
        CaffeineCacheManager mgr = new CaffeineCacheManager("testcaseData");
        mgr.setCaffeine(Caffeine.newBuilder()
            .maximumSize(200)
            .expireAfterWrite(10, TimeUnit.MINUTES)
            .recordStats());
        return mgr;
    }
}
