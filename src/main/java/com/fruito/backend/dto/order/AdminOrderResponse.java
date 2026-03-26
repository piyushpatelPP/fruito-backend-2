package com.fruito.backend.dto.order;

import java.util.List;

public class AdminOrderResponse {

    private final Long orderId;
    private final String status;
    private final String paymentStatus;
    private final Long userId;
    private final String userEmail;
    // ── Customer contact details ──────────────────────────────────────────────
    private final String userPhone;
    private final String userAddress;
    // ─────────────────────────────────────────────────────────────────────────
    private final Double totalAmount;
    private final String orderDate;
    private final String estimatedDeliveryAt;
    private final List<OrderItemResponse> items;

    public AdminOrderResponse(
            Long orderId,
            String status,
            String paymentStatus,
            Long userId,
            String userEmail,
            String userPhone,
            String userAddress,
            Double totalAmount,
            String orderDate,
            String estimatedDeliveryAt,
            List<OrderItemResponse> items
    ) {
        this.orderId            = orderId;
        this.status             = status;
        this.paymentStatus      = paymentStatus;
        this.userId             = userId;
        this.userEmail          = userEmail;
        this.userPhone          = userPhone;
        this.userAddress        = userAddress;
        this.totalAmount        = totalAmount;
        this.orderDate          = orderDate;
        this.estimatedDeliveryAt = estimatedDeliveryAt;
        this.items              = items;
    }

    public Long getOrderId()              { return orderId; }
    public String getStatus()             { return status; }
    public String getPaymentStatus()      { return paymentStatus; }
    public Long getUserId()               { return userId; }
    public String getUserEmail()          { return userEmail; }
    public String getUserPhone()          { return userPhone; }
    public String getUserAddress()        { return userAddress; }
    public Double getTotalAmount()        { return totalAmount; }
    public String getOrderDate()          { return orderDate; }
    public String getEstimatedDeliveryAt(){ return estimatedDeliveryAt; }
    public List<OrderItemResponse> getItems() { return items; }
}
