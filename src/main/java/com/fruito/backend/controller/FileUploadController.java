package com.fruito.backend.controller;

import com.fruito.backend.service.CloudinaryService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@RestController
@RequestMapping("/api/uploads")
public class FileUploadController {

    private final String uploadDir = "uploads/";
    private final CloudinaryService cloudinaryService;

    public FileUploadController(CloudinaryService cloudinaryService) {
        this.cloudinaryService = cloudinaryService;
        File dir = new File(uploadDir);
        if (!dir.exists()) {
            dir.mkdirs();
        }
    }

    @PostMapping
    public String uploadFile(@RequestParam("file") MultipartFile file, @RequestParam(defaultValue = "local") String type) throws IOException {
        if (file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }

        if ("cloudinary".equals(type)) {
            return cloudinaryService.uploadFile(file);
        }

        String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Path path = Paths.get(uploadDir + fileName);
        Files.write(path, file.getBytes());

        return "/uploads/" + fileName;
    }
}
