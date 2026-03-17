package com.fruito.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private Double totalAmount;

    /** Razorpay order ID returned when creating a payment session */
    private String razorpayOrderId;

    /** Payment status: PENDING, PAID, FAILED */
    @Column(nullable = false)
    private String paymentStatus = "PENDING";

    /** Admin-set estimated delivery datetime */
    private LocalDateTime estimatedDeliveryAt;

    public Order() {}

    public Order(User user) {
        this.user = user;
        this.status = OrderStatus.PLACED;
        this.createdAt = LocalDateTime.now();
        this.totalAmount = 0.0;
        this.paymentStatus = "PENDING";
    }

    // ===== getters =====
    public Long getId() { return id; }
    public User getUser() { return user; }
    public List<OrderItem> getItems() { return items; }
    public OrderStatus getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public Double getTotalAmount() { return totalAmount; }
    public String getRazorpayOrderId() { return razorpayOrderId; }
    public String getPaymentStatus() { return paymentStatus; }
    public LocalDateTime getEstimatedDeliveryAt() { return estimatedDeliveryAt; }

    // ===== setters =====
    public void setStatus(OrderStatus status) { this.status = status; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }
    public void setRazorpayOrderId(String razorpayOrderId) { this.razorpayOrderId = razorpayOrderId; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }
    public void setEstimatedDeliveryAt(LocalDateTime estimatedDeliveryAt) { this.estimatedDeliveryAt = estimatedDeliveryAt; }
}
