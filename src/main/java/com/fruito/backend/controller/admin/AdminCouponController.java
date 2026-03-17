package com.fruito.backend.controller.admin;

import com.fruito.backend.model.Coupon;
import com.fruito.backend.service.CouponService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/admin/coupons")
public class AdminCouponController {
    private final CouponService couponService;

    public AdminCouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    @GetMapping
    public List<Coupon> getAll() {
        return couponService.getAll();
    }

    @PostMapping
    public Coupon create(@RequestBody Coupon coupon) {
        return couponService.save(coupon);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        couponService.delete(id);
    }
}
