package com.cafeflow.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;
import java.util.Arrays;
import java.util.List;

@Service
public class LocalFileStorageService implements FileStorageService {

    @Value("${cafeflow.upload.dir}")
    private String uploadDir;

    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList("jpg", "jpeg", "png", "webp");
    private static final List<String> ALLOWED_MIME_TYPES = Arrays.asList("image/jpeg", "image/png", "image/webp");
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    @Override
    public String storeFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot store empty file.");
        }

        // Validate size
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds 5MB limit.");
        }

        // Validate MIME type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Unsupported file type. Only JPEG, PNG, and WEBP images are allowed.");
        }

        // Extract and validate extension
        String originalFilename = file.getOriginalFilename();
        String fileExtension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
        }

        if (!ALLOWED_EXTENSIONS.contains(fileExtension)) {
            throw new IllegalArgumentException("Unsupported file extension.");
        }

        // Generate unique filename
        String cleanFilename = UUID.randomUUID().toString() + "." + fileExtension;

        try {
            Path targetLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
            
            // Create directories if they don't exist
            if (!Files.exists(targetLocation)) {
                Files.createDirectories(targetLocation);
            }

            Path targetPath = targetLocation.resolve(cleanFilename);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            return cleanFilename;
        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + cleanFilename + ". Please try again!", ex);
        }
    }

    @Override
    public void deleteFile(String filename) {
        try {
            Path filePath = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(filename);
            Files.deleteIfExists(filePath);
        } catch (IOException ex) {
            // Log warning, do not block execution
            System.err.println("Failed to delete local file: " + filename + ". Error: " + ex.getMessage());
        }
    }
}
