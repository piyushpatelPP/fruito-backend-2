package com.fruito.backend.dto.cart;

import com.fruito.backend.dto.product.FruitResponse;

public class CartItemResponse {

    private final Long id;
    private final FruitResponse fruit;
    private final int quantity;

    public CartItemResponse(Long id, FruitResponse fruit, int quantity) {
        this.id = id;
        this.fruit = fruit;
        this.quantity = quantity;
    }

    public Long getId() { return id; }
    public FruitResponse getProduct() { return fruit; }
    public int getQuantity() { return quantity; }
}

