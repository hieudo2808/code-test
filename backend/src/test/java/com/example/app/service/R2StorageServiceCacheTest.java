package com.example.app.service;

import com.example.app.config.CacheConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.cache.CacheManager;
import org.springframework.context.annotation.Import;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.http.AbortableInputStream;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.io.ByteArrayInputStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SpringBootTest(classes = R2StorageService.class, properties = {
        "r2.bucket=test-bucket",
        "r2.region=test-region"
})
@Import(CacheConfig.class)
class R2StorageServiceCacheTest {

    @Autowired
    private R2StorageService r2StorageService;

    @Autowired
    private CacheManager cacheManager;

    @MockBean
    private S3Client s3Client;

    @MockBean
    private S3Presigner s3Presigner;

    @Test
    void testCacheHitsAndEviction() {
        String path = "test/path.txt";
        String content = "Hello World";

        // Setup mock response using thenAnswer so it returns a fresh stream if called multiple times (though we only expect 1 call due to cache)
        when(s3Client.getObject(any(GetObjectRequest.class))).thenAnswer(invocation -> {
            System.out.println("s3Client.getObject called!");
            return new ResponseInputStream<>(
                    GetObjectResponse.builder().build(),
                    new ByteArrayInputStream(content.getBytes())
            );
        });

        // First read - should hit S3
        String res1 = r2StorageService.readAsString(path);
        System.out.println("res1 = " + res1);
        assertEquals(content, res1);
        verify(s3Client, times(1)).getObject(any(GetObjectRequest.class));

        // Second read - should hit cache
        String res2 = r2StorageService.readAsString(path);
        assertEquals(content, res2);
        verify(s3Client, times(1)).getObject(any(GetObjectRequest.class)); // Still 1 invocation

        // Evict cache
        r2StorageService.evictCache(path);

        // Third read - should hit S3 again because cache was evicted
        String res3 = r2StorageService.readAsString(path);
        assertEquals(content, res3);
        verify(s3Client, times(2)).getObject(any(GetObjectRequest.class)); // 2 invocations now
    }
}
