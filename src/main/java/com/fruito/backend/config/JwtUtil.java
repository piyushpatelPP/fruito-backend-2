package com.fruito.backend.config;

import com.fruito.backend.model.Role;
import io.jsonwebtoken.*;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.*;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Arrays;
import java.util.Base64;
import java.util.Date;

/**
 * JWT utility using RSA (RS256) asymmetric signing.
 * Tokens are signed with the private key and verified with the public key.
 * Keys are injected from environment variables — never hardcoded.
 *
 * Supports keys in PEM format (with or without -----BEGIN ... ----- headers).
 * Supports both PKCS#1 (BEGIN RSA PRIVATE KEY) and PKCS#8 (BEGIN PRIVATE KEY).
 */
@Component
public class JwtUtil {

    private final long expiration;   // injected from jwt.expiry-ms (e.g. 3600000 = 1h)
    private final PrivateKey privateKey;
    private final PublicKey  publicKey;

    public JwtUtil(
            @Value("${jwt.private-key}") String privateKeyPem,
            @Value("${jwt.public-key}")  String publicKeyPem,
            @Value("${jwt.expiry-ms}")   long expiration
    ) {
        this.expiration = expiration;
        // DEBUG START
        System.out.println("PRIVATE KEY STARTS WITH: " + privateKeyPem.substring(0, 30));
        System.out.println("PUBLIC KEY STARTS WITH: " + publicKeyPem.substring(0, 30));
        //  DEBUG END

        try {
            KeyFactory kf = KeyFactory.getInstance("RSA");

            // ── Public Key (X.509 / SubjectPublicKeyInfo) ──────────────────────
            byte[] pubBytes = decodePem(publicKeyPem);
            publicKey = kf.generatePublic(new X509EncodedKeySpec(pubBytes));

            // ── Private Key — detect PKCS#1 vs PKCS#8 ─────────────────────────
            byte[] privRawBytes = decodePem(privateKeyPem);

            // "-----BEGIN RSA PRIVATE KEY-----" → PKCS#1 (needs wrapping to PKCS#8)
            // "-----BEGIN PRIVATE KEY-----"     → PKCS#8 (use directly)
            byte[] privBytes = isPkcs1(privateKeyPem)
                    ? wrapPkcs1InPkcs8(privRawBytes)
                    : privRawBytes;

            privateKey = kf.generatePrivate(new PKCS8EncodedKeySpec(privBytes));

        } catch (Exception e) {
            throw new IllegalStateException(
                    "Failed to load RSA JWT keys from environment — " +
                    "ensure JWT_PRIVATE_KEY and JWT_PUBLIC_KEY are valid RSA PEM keys.", e);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // PEM utilities
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Strips PEM header/footer lines and decodes the Base64 body.
     * Works whether the value includes "-----BEGIN ...-----" lines or is raw Base64.
     */
    private static byte[] decodePem(String pem) {
        String stripped = pem
                .replace("\\n", "\n")           // convert literal \n (Railway single-line format) to real newlines
                .replaceAll("-----BEGIN[^-]*-----", "")
                .replaceAll("-----END[^-]*-----", "")
                .replaceAll("\\s+", "");         // strip all whitespace including real newlines
        return Base64.getDecoder().decode(stripped);
    }

    /** Returns true if the PEM string is a PKCS#1 RSA private key. */
    private static boolean isPkcs1(String pem) {
        return pem.contains("BEGIN RSA PRIVATE KEY");
    }

    /**
     * Wraps a raw PKCS#1 RSA private key DER blob into a minimal PKCS#8
     * PrivateKeyInfo DER structure that Java's KeyFactory can parse natively —
     * no BouncyCastle dependency required.
     *
     * PKCS#8 PrivateKeyInfo ::= SEQUENCE {
     *   version           Version (INTEGER 0),
     *   algorithm         AlgorithmIdentifier (OID rsaEncryption, NULL),
     *   privateKey        OCTET STRING containing the PKCS#1 key bytes
     * }
     */
    private static byte[] wrapPkcs1InPkcs8(byte[] pkcs1Bytes) {
        // AlgorithmIdentifier: SEQUENCE { OID rsaEncryption (1.2.840.113549.1.1.1), NULL }
        byte[] algId = new byte[]{
            0x30, 0x0d,
              0x06, 0x09,
                0x2a, (byte)0x86, 0x48, (byte)0x86, (byte)0xf7, 0x0d, 0x01, 0x01, 0x01,
              0x05, 0x00
        };

        // Version ::= INTEGER 0
        byte[] version = new byte[]{ 0x02, 0x01, 0x00 };

        // privateKey OCTET STRING containing the PKCS#1 DER
        byte[] octetStringHeader = encodeLength(0x04, pkcs1Bytes.length);
        byte[] octetString = concat(octetStringHeader, pkcs1Bytes);

        // Inner content = version || algId || octetString
        byte[] inner = concat(concat(version, algId), octetString);

        // Outer SEQUENCE wraps everything
        byte[] outerHeader = encodeLength(0x30, inner.length);
        return concat(outerHeader, inner);
    }

    /** Encodes a DER tag + length (handles 1-byte and 2-byte lengths up to 65535). */
    private static byte[] encodeLength(int tag, int length) {
        if (length < 128) {
            return new byte[]{ (byte) tag, (byte) length };
        } else if (length < 256) {
            return new byte[]{ (byte) tag, (byte) 0x81, (byte) length };
        } else {
            return new byte[]{ (byte) tag, (byte) 0x82,
                    (byte) (length >> 8), (byte) (length & 0xff) };
        }
    }

    private static byte[] concat(byte[] a, byte[] b) {
        byte[] result = Arrays.copyOf(a, a.length + b.length);
        System.arraycopy(b, 0, result, a.length, b.length);
        return result;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // JWT operations
    // ──────────────────────────────────────────────────────────────────────────

    public String generateToken(String email, Role role) {
        return Jwts.builder()
                .subject(email)
                .claim("role", role.name())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(privateKey)          // JJWT 0.12 auto-selects RS256 for RSA keys
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
