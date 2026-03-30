package com.fruito.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.MediaType;

import java.util.Map;

@Service
public class RecaptchaService {

    @Value("${recaptcha.secret:}")
    private String recaptchaSecret;

    private static final String RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

    public boolean verifyCaptcha(String captchaToken) {
        if (recaptchaSecret == null || recaptchaSecret.isBlank()) {
            // If secret is not configured, we might bypass or fail.
            // Let's return true if no secret is set so we don't break local dev environments without keys.
            return true;
        }

        if (captchaToken == null || captchaToken.isBlank()) {
            return false;
        }

        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
            map.add("secret", recaptchaSecret);
            map.add("response", captchaToken);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);

            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> response = restTemplate.postForEntity(
                    RECAPTCHA_VERIFY_URL, request, (Class<Map<String, Object>>) (Class<?>) Map.class);

            if (response.getBody() == null) return false;

            Object success = response.getBody().get("success");
            return Boolean.TRUE.equals(success);
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}
