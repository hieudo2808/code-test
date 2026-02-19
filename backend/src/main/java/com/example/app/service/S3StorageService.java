package com.example.app.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.io.InputStream;
import java.util.UUID;

@Slf4j
@Service
public class S3StorageService {

    private final S3Client s3Client;
    private final String bucketName;
    private final String region;

    public S3StorageService(
            S3Client s3Client,
            @Value("${aws.s3.bucket}") String bucketName,
            @Value("${aws.s3.region}") String region) {
        this.s3Client = s3Client;
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

    public String saveSubmissionOutput(UUID submissionId, UUID testcaseId, String content) {
        String path = String.format("submissions/%s/results/%s/output.txt", submissionId, testcaseId);
        byte[] bytes = content.getBytes();
        uploadFile(path, new java.io.ByteArrayInputStream(bytes), bytes.length);
        return path;
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
                .acl(ObjectCannedACL.PUBLIC_READ)
                .build();

        s3Client.putObject(request, RequestBody.fromInputStream(data, contentLength));
        log.info("Uploaded avatar for user {}: {}", userId, path);

        return String.format("https://%s.s3.%s.amazonaws.com/%s", bucketName, region, path);
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
            log.debug("Deleted file from S3: {}", path);
        } catch (Exception e) {
            log.warn("Failed to delete file from S3: {}", path, e);
        }
    }

    public int getFileSizeKb(String path) {
        try {
            HeadObjectRequest request = HeadObjectRequest.builder()
                    .bucket(bucketName)
                    .key(path)
                    .build();
            
            HeadObjectResponse response = s3Client.headObject(request);
            return (int) (response.contentLength() / 1024);
        } catch (Exception e) {
            log.warn("Failed to get file size from S3: {}", path, e);
            return 0;
        }
    }

    private void uploadFile(String path, InputStream data, long contentLength) {
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(path)
                .contentType("text/plain")
                .serverSideEncryption(ServerSideEncryption.AES256)
                .build();

        s3Client.putObject(request, RequestBody.fromInputStream(data, contentLength));
        log.debug("Uploaded file to S3: {}", path);
    }

    private String buildPath(UUID problemId, UUID testcaseId, String filename) {
        return String.format("problems/%s/testcases/%s/%s", problemId, testcaseId, filename);
    }
}
