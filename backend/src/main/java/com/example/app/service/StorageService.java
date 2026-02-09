package com.example.app.service;

import java.io.InputStream;
import java.util.UUID;

/**
 * Storage abstraction for testcase files.
 * Implementations can use S3, local filesystem, or other storage backends.
 */
public interface StorageService {

    /**
     * Save testcase input file
     * @return The storage path
     */
    String saveTestcaseInput(UUID problemId, UUID testcaseId, InputStream data, long contentLength);

    /**
     * Save testcase output file
     * @return The storage path
     */
    String saveTestcaseOutput(UUID problemId, UUID testcaseId, InputStream data, long contentLength);

    /**
     * Get file content as InputStream
     */
    InputStream getFile(String path);

    /**
     * Delete a file
     */
    void delete(String path);

    /**
     * Get file size in KB
     */
    int getFileSizeKb(String path);
}
