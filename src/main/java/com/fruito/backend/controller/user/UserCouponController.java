package com.fruito.backend.controller.user;

import com.fruito.backend.model.Coupon;
import com.fruito.backend.service.CouponService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
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
     * Validates a coupon code, optionally checking cart total against minimum order value.
     *
     * Uses @RequestParam instead of @PathVariable so the code never appears
     * inside the URL path — eliminates the path-traversal surface entirely.
     *
     * GET /user/coupons/validate?code=SAVE10
     * GET /user/coupons/validate?code=SAVE10&total=320.00
     *
     * When `total` is provided, response includes:
     *  - valid: true/false
     *  - discount: computed discount amount (0 if total < minOrderValue)
     *  - minOrderValue: the coupon's minimum cart total
     *  - meetsMinimum: whether the current total satisfies the minimum
     */
    @GetMapping("/validate")
    public ResponseEntity<?> validate(
            @RequestParam String code,
            @RequestParam(required = false) Double total) {

        // 1. Reject anything that doesn't match the strict allowlist — before DB call
        if (code == null || !code.matches(COUPON_CODE_PATTERN)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("valid", false, "message", "Invalid coupon code format"));
        }

        // 2. DB lookup (Spring Data uses parameterized queries — SQL injection safe)
        Optional<Coupon> couponOpt = couponService.findByCode(code);

        if (couponOpt.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("valid", false, "message", "Coupon not found"));
        }

        Coupon coupon = couponOpt.get();

        if (!coupon.isActive()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("valid", false, "message", "Coupon is no longer active"));
        }

        if (coupon.getExpiryDate() != null && coupon.getExpiryDate().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("valid", false, "message", "Coupon has expired"));
        }

        // 3. Build structured response
        Map<String, Object> response = new HashMap<>();
        response.put("valid", true);
        response.put("code", coupon.getCode());
        response.put("discountPercentage", coupon.getDiscountPercentage());
        response.put("minOrderValue", coupon.getMinOrderValue());
        response.put("maxDiscount", coupon.getMaxDiscount());

        if (total != null) {
            boolean meetsMinimum = coupon.getMinOrderValue() == null || total >= coupon.getMinOrderValue();
            response.put("meetsMinimum", meetsMinimum);

            if (meetsMinimum) {
                double discount = (total * coupon.getDiscountPercentage()) / 100.0;
                if (coupon.getMaxDiscount() != null && discount > coupon.getMaxDiscount()) {
                    discount = coupon.getMaxDiscount();
                }
                response.put("discount", discount);
            } else {
                response.put("discount", 0.0);
                // Tell the frontend the coupon is structurally valid but can't be applied yet
                response.put("message", "Min order \u20b9" + coupon.getMinOrderValue().intValue() + " required");
            }
        }

        return ResponseEntity.ok(response);
    }
}
