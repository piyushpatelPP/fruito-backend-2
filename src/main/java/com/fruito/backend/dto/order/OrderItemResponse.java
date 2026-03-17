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
    // Renamed from getProduct() to getFruit() so JSON output uses "fruit" matching frontend
    public FruitResponse getFruit() { return fruit; }
    public int getQuantity() { return quantity; }
}
