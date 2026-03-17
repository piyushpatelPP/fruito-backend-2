package com.fruito.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Base64;

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

    public String uploadFile(MultipartFile file) throws IOException {
        if ("NOT_SET".equals(cloudName)) {
            throw new UnsupportedOperationException(
                "Cloudinary credentials not configured. " +
                "Set cloudinary.cloud-name, cloudinary.api-key, cloudinary.api-secret " +
                "in application.properties to enable cloud uploads."
            );
        }

        // Use Cloudinary unsigned upload REST API
        String uploadUrl = "https://api.cloudinary.com/v1_1/" + cloudName + "/image/upload";
        String auth = Base64.getEncoder().encodeToString((apiKey + ":" + apiSecret).getBytes());
        String boundary = "----FormBoundary" + System.currentTimeMillis();

        byte[] fileBytes = file.getBytes();
        String contentType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload";

        // Build multipart body manually
        String header = "--" + boundary + "\r\n" +
                        "Content-Disposition: form-data; name=\"file\"; filename=\"" + originalName + "\"\r\n" +
                        "Content-Type: " + contentType + "\r\n\r\n";
        String footer = "\r\n--" + boundary + "--\r\n";

        byte[] headerBytes = header.getBytes();
        byte[] footerBytes = footer.getBytes();
        byte[] body = new byte[headerBytes.length + fileBytes.length + footerBytes.length];
        System.arraycopy(headerBytes, 0, body, 0, headerBytes.length);
        System.arraycopy(fileBytes, 0, body, headerBytes.length, fileBytes.length);
        System.arraycopy(footerBytes, 0, body, headerBytes.length + fileBytes.length, footerBytes.length);

        try {
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(uploadUrl))
                    .header("Authorization", "Basic " + auth)
                    .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                    .POST(HttpRequest.BodyPublishers.ofByteArray(body))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            String responseBody = response.body();

            // Parse secure_url from response JSON (simple extraction without external lib)
            int urlStart = responseBody.indexOf("\"secure_url\":\"");
            if (urlStart == -1) {
                throw new IOException("Cloudinary upload failed: " + responseBody);
            }
            int start = urlStart + 13;
            int end = responseBody.indexOf('"', start);
            return responseBody.substring(start, end);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("Upload interrupted", e);
        }
    }
}
