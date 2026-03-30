package com.fruito.backend.dto.order;

import com.fruito.backend.dto.product.FruitResponse;

public class OrderItemResponse {

    private Long id;
    private FruitResponse fruit;
    private int quantity;

    public OrderItemResponse(Long id, FruitResponse fruit, int quantity) {
        this.id = id;
        this.fruit = fruit;
        this.quantity = quantity;
    }

    public Long getId() { return id; }
    // Serialized as "fruit" for structured access, and "fruitName" for admin dashboard direct access
    public FruitResponse getFruit() { return fruit; }
    // Convenience top-level field: AdminDashboard.tsx accesses item.fruitName directly
    public String getFruitName() { return fruit != null ? fruit.getName() : null; }
    public int getQuantity() { return quantity; }
}
