package com.fruito.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "coupons")
@Data
public class Coupon {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String code;

    private Double discountPercentage;
    private Double minOrderValue;
    private Double maxDiscount;
    private LocalDateTime expiryDate;
    private boolean isActive = true;
}
