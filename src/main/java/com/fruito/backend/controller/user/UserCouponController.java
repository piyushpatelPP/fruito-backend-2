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
    private final CouponService couponService;

    public UserCouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    @GetMapping("/validate/{code}")
    public ResponseEntity<?> validate(@PathVariable String code) {
        Optional<Coupon> couponOpt = couponService.findByCode(code);
        
        if (couponOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Invalid coupon code");
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
