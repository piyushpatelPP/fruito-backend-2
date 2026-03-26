package com.fruito.backend.controller.user;

import com.fruito.backend.model.Coupon;
import com.fruito.backend.service.CouponService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.Optional;

@RestController
@RequestMapping("/user/coupons")
public class UserCouponController {

    /**
     * Strict allowlist for coupon codes.
     * Only uppercase letters, digits, underscores, and hyphens — 2 to 30 chars.
     * Blocks any path-traversal or special-character payloads
     * (e.g. "../etc/passwd", "%2F", null bytes, etc.).
     */
    private static final String COUPON_CODE_PATTERN = "^[A-Z0-9_\\-]{2,30}$";

    private final CouponService couponService;

    public UserCouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    /**
     * Validates a coupon code.
     *
     * Uses @RequestParam instead of @PathVariable so the code never appears
     * inside the URL path — eliminates the path-traversal surface entirely.
     *
     * GET /user/coupons/validate?code=SAVE10
     */
    @GetMapping("/validate")
    public ResponseEntity<?> validate(@RequestParam String code) {

        // 1. Reject anything that doesn't match the strict allowlist — before DB call
        if (code == null || !code.matches(COUPON_CODE_PATTERN)) {
            return ResponseEntity.badRequest()
                    .body("Invalid coupon code format");
        }

        // 2. DB lookup (Spring Data uses parameterized queries — SQL injection safe)
        Optional<Coupon> couponOpt = couponService.findByCode(code);

        if (couponOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Coupon not found");
        }

        Coupon coupon = couponOpt.get();

        if (!coupon.isActive()) {
            return ResponseEntity.badRequest().body("Coupon is no longer active");
        }

        if (coupon.getExpiryDate() != null && coupon.getExpiryDate().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body("Coupon has expired");
        }

        return ResponseEntity.ok(coupon);
    }
}
