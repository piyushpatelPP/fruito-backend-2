package com.fruito.backend.controller;

import com.fruito.backend.config.JwtUtil;
import com.fruito.backend.dto.JwtResponse;
import com.fruito.backend.model.Role;
import com.fruito.backend.model.User;
import com.fruito.backend.repository.UserRepository;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Google Sign-In endpoint (stateless ID-token strategy).
 *
 * Security layers applied in order:
 *  1. idToken size & character allowlist — rejects oversized / script-injected payloads
 *  2. Google's own cryptographic signature verification — proves token is authentic
 *  3. Email format allowlist — sanitizes the value before DB interaction
 *  4. Spring Data parameterized queries — prevent SQL injection at ORM level
 *
 * POST /auth/google
 * Body: { "idToken": "<google credential>" }
 */
@RestController
@RequestMapping("/auth")
public class GoogleAuthController {

    // ── Sanitization constants ────────────────────────────────────────────────

    /**
     * Google ID tokens are base64url JWTs: header.payload.signature
     * Typical length is 900–1100 chars. Cap at 4096 to block oversized payloads
     * that might exploit parser vulnerabilities or abuse memory.
     */
    private static final int    MAX_ID_TOKEN_LENGTH = 4096;

    /**
     * JWT character allowlist: base64url alphabet + two dots (the . separators).
     * Blocks any HTML tag characters (<, >), script payloads, null bytes, etc.
     */
    private static final Pattern ID_TOKEN_PATTERN =
            Pattern.compile("^[A-Za-z0-9+/=_\\-\\.]+$");

    /**
     * RFC 5321-compliant email allowlist (conservative).
     * Blocks XSS payloads that could appear in Google's unverified sub-fields,
     * and control characters that might confuse downstream systems.
     */
    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}$");

    /** Maximum email length per RFC 5321 */
    private static final int MAX_EMAIL_LENGTH = 254;

    // ─────────────────────────────────────────────────────────────────────────

    private final GoogleIdTokenVerifier verifier;
    private final UserRepository        userRepository;
    private final JwtUtil               jwtUtil;
    private final PasswordEncoder       passwordEncoder;

    public GoogleAuthController(
            @Value("${google.client-id}") String clientId,
            UserRepository userRepository,
            JwtUtil jwtUtil,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository  = userRepository;
        this.jwtUtil         = jwtUtil;
        this.passwordEncoder = passwordEncoder;

        // Build the verifier once; it caches Google's public keys internally
        this.verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(),
                GsonFactory.getDefaultInstance()
        )
                .setAudience(Collections.singletonList(clientId))
                .build();
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleSignIn(@RequestBody Map<String, String> body) {

        String rawIdToken = body.get("idToken");

        // ── Layer 1: Input sanitization — block XSS / oversized payloads ────
        if (rawIdToken == null || rawIdToken.isBlank()) {
            return ResponseEntity.badRequest().body("idToken is required");
        }
        if (rawIdToken.length() > MAX_ID_TOKEN_LENGTH) {
            return ResponseEntity.badRequest().body("idToken exceeds maximum allowed length");
        }
        if (!ID_TOKEN_PATTERN.matcher(rawIdToken).matches()) {
            // Contains characters that are never in a legitimate JWT
            // (e.g. <script>, null bytes, path separators)
            return ResponseEntity.badRequest().body("idToken contains invalid characters");
        }
        // ────────────────────────────────────────────────────────────────────

        // ── Layer 2: Cryptographic verification by Google ────────────────────
        GoogleIdToken idToken;
        try {
            idToken = verifier.verify(rawIdToken);
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Token verification failed");
        }
        if (idToken == null) {
            return ResponseEntity.status(401).body("Invalid Google token");
        }
        // ────────────────────────────────────────────────────────────────────

        // ── Layer 3: Sanitize & validate email from verified payload ─────────
        Payload payload = idToken.getPayload();

        if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
            return ResponseEntity.status(401).body("Google account email not verified");
        }

        String email = payload.getEmail();

        if (email == null || email.length() > MAX_EMAIL_LENGTH
                || !EMAIL_PATTERN.matcher(email).matches()) {
            // Shouldn't happen with a valid Google token, but belt-and-suspenders:
            // prevents any crafted payload email from reaching the DB.
            return ResponseEntity.status(401).body("Invalid email in Google token");
        }

        // Normalize: lowercase (emails are case-insensitive, DB may store them mixed)
        email = email.toLowerCase();
        // ────────────────────────────────────────────────────────────────────

        // ── Layer 4: DB interaction (Spring Data → parameterized queries) ────
        // Auto-create user on first Google sign-in (role = USER by default)
        final String finalEmail = email;
        User user = userRepository.findByEmail(finalEmail).orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail(finalEmail);
            // Random locked password — Google users never use password login
            newUser.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
            newUser.setRole(Role.USER);
            return userRepository.save(newUser);
        });
        // ────────────────────────────────────────────────────────────────────

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
        return ResponseEntity.ok(
                new JwtResponse(token, user.getEmail(), user.getRole().name(), user.getId())
        );
    }
}