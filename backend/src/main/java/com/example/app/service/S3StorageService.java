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
public class S3StorageService implements StorageService {

    private final S3Client s3Client;
    private final String bucketName;

    public S3StorageService(
            S3Client s3Client,
            @Value("${aws.s3.bucket}") String bucketName) {
        this.s3Client = s3Client;
        this.bucketName = bucketName;
    }

    @Override
    public String saveTestcaseInput(UUID problemId, UUID testcaseId, InputStream data, long contentLength) {
        String path = buildPath(problemId, testcaseId, "input.txt");
        uploadFile(path, data, contentLength);
        return path;
    }

    @Override
    public String saveTestcaseOutput(UUID problemId, UUID testcaseId, InputStream data, long contentLength) {
        String path = buildPath(problemId, testcaseId, "output.txt");
        uploadFile(path, data, contentLength);
        return path;
    }

    @Override
    public InputStream getFile(String path) {
        GetObjectRequest request = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(path)
                .build();
        
        return s3Client.getObject(request);
    }

    @Override
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

    @Override
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
                .build();

        s3Client.putObject(request, RequestBody.fromInputStream(data, contentLength));
        log.debug("Uploaded file to S3: {}", path);
    }

    private String buildPath(UUID problemId, UUID testcaseId, String filename) {
        return String.format("problems/%s/testcases/%s/%s", problemId, testcaseId, filename);
    }
}
