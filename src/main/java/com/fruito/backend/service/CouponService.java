package com.fruito.backend.service;

import com.fruito.backend.model.Coupon;
import com.fruito.backend.repository.CouponRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class CouponService {
    private final CouponRepository couponRepository;

    public CouponService(CouponRepository couponRepository) {
        this.couponRepository = couponRepository;
    }

    public List<Coupon> getAll() {
        return couponRepository.findAll();
    }

    public Optional<Coupon> findByCode(String code) {
        return couponRepository.findByCode(code);
    }

    public Coupon save(Coupon coupon) {
        return couponRepository.save(coupon);
    }

    public void delete(Long id) {
        couponRepository.deleteById(id);
    }
}
