package com.fruito.backend.controller.user;

import com.fruito.backend.model.User;
import com.fruito.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.regex.Pattern;

/**
 * Allows authenticated users to update their own profile (phone + address).
 * Strictly scoped to the requesting user via JWT — no IDOR possible.
 *
 * PUT /user/profile
 * Body: { "phone": "9876543210", "address": "123 Main St, Mumbai" }
 */
@RestController
@RequestMapping("/user/profile")
public class UserProfileController {

    /** E.164-style: optional +, 7–15 digits */
    private static final Pattern PHONE_PATTERN =
            Pattern.compile("^\\+?[0-9]{7,15}$");

    private static final int MAX_ADDRESS_LENGTH = 400;

    private final UserRepository userRepository;

    public UserProfileController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /** GET /user/profile — returns current user's phone and address */
    @GetMapping
    public ResponseEntity<?> getProfile(Authentication auth) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(Map.of(
                "email",   user.getEmail(),
                "phone",   user.getPhone()   != null ? user.getPhone()   : "",
                "address", user.getAddress() != null ? user.getAddress() : ""
        ));
    }

    /** PUT /user/profile — saves phone and/or address for the authenticated user */
    @PutMapping
    @SuppressWarnings("null")
    public ResponseEntity<?> updateProfile(
            Authentication auth,
            @RequestBody Map<String, String> body
    ) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // ── Phone validation ──────────────────────────────────────────────────
        String phone = body.get("phone");
        if (phone != null && !phone.isBlank()) {
            phone = phone.trim();
            if (!PHONE_PATTERN.matcher(phone).matches()) {
                return ResponseEntity.badRequest()
                        .body("Invalid phone number format (7–15 digits, optional leading +)");
            }
            user.setPhone(phone);
        }

        // ── Address validation ────────────────────────────────────────────────
        String address = body.get("address");
        if (address != null && !address.isBlank()) {
            address = address.trim();
            if (address.length() > MAX_ADDRESS_LENGTH) {
                return ResponseEntity.badRequest()
                        .body("Address must not exceed " + MAX_ADDRESS_LENGTH + " characters");
            }
            // Strip HTML tags to prevent stored XSS in address field
            address = address.replaceAll("<[^>]*>", "");
            user.setAddress(address);
        }

        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Profile updated successfully"));
    }
}
