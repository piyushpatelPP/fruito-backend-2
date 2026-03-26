package com.fruito.backend.controller;

import com.fruito.backend.service.CloudinaryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.Set;

/**
 * POST /api/uploads
 * Always uploads to Cloudinary — returns the permanent HTTPS URL as a plain string.
 *
 * Changed from local filesystem (broken on Railway) to Cloudinary.
 * Response format is unchanged: returns a URL string the frontend stores directly.
 */
@RestController
@RequestMapping("/api/uploads")
public class FileUploadController {

    private static final Set<String> ALLOWED_TYPES =
            Set.of("image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif");

    /** 5 MB max */
    private static final long MAX_SIZE_BYTES = 5L * 1024 * 1024;

    private final CloudinaryService cloudinaryService;

    public FileUploadController(CloudinaryService cloudinaryService) {
        this.cloudinaryService = cloudinaryService;
    }

    @PostMapping
    public ResponseEntity<String> uploadFile(
            @RequestParam("file") MultipartFile file
    ) throws IOException {

        // ── Validation ──────────────────────────────────────────────────────
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is empty");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only JPEG, PNG, WebP, and GIF images are allowed");
        }

        if (file.getSize() > MAX_SIZE_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "File size must not exceed 5 MB");
        }

        // ── Upload to Cloudinary → permanent HTTPS URL ───────────────────────
        String url = cloudinaryService.uploadFile(file);
        return ResponseEntity.ok(url);
    }
}
