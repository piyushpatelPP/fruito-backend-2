package com.fruito.backend.dto.order;

import java.util.List;

public class OrderResponse {

    private Long id;
    private String status;
    private Double totalAmount;
    private String orderDate;
    private List<OrderItemResponse> items;

    public OrderResponse(Long id, String status, Double totalAmount,
                         String orderDate, List<OrderItemResponse> items) {
        this.id = id;
        this.status = status;
        this.totalAmount = totalAmount;
        this.orderDate = orderDate;
        this.items = items;
    }

    public Long getId() { return id; }
    public String getStatus() { return status; }
    public Double getTotalAmount() { return totalAmount; }
    public String getOrderDate() { return orderDate; }
    public List<OrderItemResponse> getItems() { return items; }
}
