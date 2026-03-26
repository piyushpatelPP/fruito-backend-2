package com.fruito.backend.config;

import com.fruito.backend.model.Role;
import io.jsonwebtoken.*;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.*;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.Date;

/**
 * JWT utility using EdDSA (Ed25519) asymmetric signing.
 * Tokens are signed with the private key and verified with the public key.
 * Keys are injected from environment variables — never hardcoded.
 */
@Component
public class JwtUtil {

    private final long expiration;   // injected from jwt.expiry-ms (e.g. 3600000 = 1h)
    private final PrivateKey privateKey;
    private final PublicKey  publicKey;

    public JwtUtil(
            @Value("${jwt.private-key}") String privateKeyBase64,
            @Value("${jwt.public-key}")  String publicKeyBase64,
            @Value("${jwt.expiry-ms}")   long expiration
    ) {
        this.expiration = expiration;
        try {
            KeyFactory kf = KeyFactory.getInstance("Ed25519");

            byte[] privBytes = Base64.getDecoder().decode(privateKeyBase64.trim());
            privateKey = kf.generatePrivate(new PKCS8EncodedKeySpec(privBytes));

            byte[] pubBytes = Base64.getDecoder().decode(publicKeyBase64.trim());
            publicKey = kf.generatePublic(new X509EncodedKeySpec(pubBytes));

        } catch (Exception e) {
            throw new IllegalStateException(
                    "Failed to load Ed25519 JWT keys from environment — " +
                    "ensure JWT_PRIVATE_KEY and JWT_PUBLIC_KEY are set correctly.", e);
        }
    }

    public String generateToken(String email, Role role) {
        return Jwts.builder()
                .subject(email)
                .claim("role", role.name())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(privateKey)          // JJWT 0.12 auto-selects EdDSA
                .compact();
    }

    public String extractEmail(String token) {
        return getClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return getClaims(token).get("role", String.class);
    }

    public boolean isTokenValid(String token) {
        try {
            getClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(publicKey)         // JJWT 0.12 API
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
