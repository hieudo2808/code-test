package com.example.app.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.io.InputStream;
import java.time.Duration;
import java.util.UUID;

@Slf4j
@Service
public class R2StorageService {
    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final String bucketName;
    private final String region;

    public R2StorageService(
            S3Client s3Client,
            S3Presigner s3Presigner,
            @Value("${r2.bucket}") String bucketName,
            @Value("${r2.region}") String region) {
        this.s3Client = s3Client;
        this.s3Presigner = s3Presigner;
        this.bucketName = bucketName;
        this.region = region;
    }

    public String saveTestcaseInput(UUID problemId, UUID testcaseId, InputStream data, long contentLength) {
        String path = buildPath(problemId, testcaseId, "input.txt");
        uploadFile(path, data, contentLength);
        return path;
    }

    public String saveTestcaseOutput(UUID problemId, UUID testcaseId, InputStream data, long contentLength) {
        String path = buildPath(problemId, testcaseId, "output.txt");
        uploadFile(path, data, contentLength);
        return path;
    }

    public void saveSubmissionOutput(UUID submissionId, UUID testcaseId, String content) {
        String path = String.format("submissions/%s/results/%s/output.txt", submissionId, testcaseId);
        byte[] bytes = content.getBytes();
        uploadFile(path, new java.io.ByteArrayInputStream(bytes), bytes.length);
    }

    public String uploadAvatar(UUID userId, String originalFilename, InputStream data, long contentLength, String contentType) {
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String path = String.format("avatars/%s/avatar%s", userId, extension);

        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(path)
                .contentType(contentType != null ? contentType : "image/jpeg")
                .build();

        s3Client.putObject(request, RequestBody.fromInputStream(data, contentLength));
        log.info("Uploaded avatar to R2 for user {}: {}", userId, path);

        return path; 
    }

    public InputStream getFile(String path) {
        GetObjectRequest request = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(path)
                .build();
        
        return s3Client.getObject(request);
    }

    public void delete(String path) {
        try {
            DeleteObjectRequest request = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(path)
                    .build();
            
            s3Client.deleteObject(request);
            log.debug("Deleted file from R2: {}", path);
        } catch (Exception e) {
            log.warn("Failed to delete file from R2: {}", path, e);
        }
    }

    public String generatePresignedGetUrl(String path, Duration duration) {
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(path)
                .build();

        GetObjectPresignRequest getObjectPresignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(duration)
                .getObjectRequest(getObjectRequest)
                .build();

        return s3Presigner.presignGetObject(getObjectPresignRequest).url().toString();
    }

    public String generatePresignedPutUrl(String path, String contentType, Duration duration) {
        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(path)
                .contentType(contentType)
                .build();

        PutObjectPresignRequest putObjectPresignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(duration)
                .putObjectRequest(putObjectRequest)
                .build();

        return s3Presigner.presignPutObject(putObjectPresignRequest).url().toString();
    }

    private void uploadFile(String path, InputStream data, long contentLength) {
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(path)
                .contentType("text/plain")
                .serverSideEncryption(ServerSideEncryption.AES256)
                .build();

        s3Client.putObject(request, RequestBody.fromInputStream(data, contentLength));
        log.debug("Uploaded file to R2: {}", path);
    }

    private String buildPath(UUID problemId, UUID testcaseId, String filename) {
        return String.format("problems/%s/testcases/%s/%s", problemId, testcaseId, filename);
    }

    public String readAsString(String path) {
        try (InputStream is = getFile(path)) {
            if (is == null) return "";
            byte[] bytes = is.readAllBytes();
            return new String(bytes, java.nio.charset.StandardCharsets.UTF_8);
        } catch (NoSuchKeyException e) {
            log.debug("R2 file not found (expected): {}", path);
            return "";
        } catch (Exception e) {
            log.error("Failed to read R2 file as string: {}", path, e);
            return "";
        }
    }
}
