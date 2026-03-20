package com.fruito.backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

/**
 * CloudinaryService — uploads images via Cloudinary REST API.
 * Configure credentials in application.properties:
 *   cloudinary.cloud-name=your_cloud_name
 *   cloudinary.api-key=your_api_key
 *   cloudinary.api-secret=your_api_secret
 *
 * If credentials are not set, throws UnsupportedOperationException.
 * The system will fall back to local file storage by default.
 */
@Service
public class CloudinaryService {

    @Value("${cloudinary.cloud-name:NOT_SET}")
    private String cloudName;

    @Value("${cloudinary.api-key:NOT_SET}")
    private String apiKey;

    @Value("${cloudinary.api-secret:NOT_SET}")
    private String apiSecret;

    private Cloudinary cloudinary;

    @PostConstruct
    public void init() {
        if (!"NOT_SET".equals(cloudName)) {
            cloudinary = new Cloudinary(ObjectUtils.asMap(
                    "cloud_name", cloudName,
                    "api_key", apiKey,
                    "api_secret", apiSecret,
                    "secure", true
            ));
        }
    }

    public String uploadFile(MultipartFile file) throws IOException {
        if (cloudinary == null) {
            throw new UnsupportedOperationException(
                "Cloudinary credentials not configured. " +
                "Set cloudinary.cloud-name, cloudinary.api-key, cloudinary.api-secret " +
                "in application.properties to enable cloud uploads."
            );
        }

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
            return uploadResult.get("secure_url").toString();
        } catch (Exception e) {
            throw new IOException("Cloudinary upload failed", e);
        }
    }
}
