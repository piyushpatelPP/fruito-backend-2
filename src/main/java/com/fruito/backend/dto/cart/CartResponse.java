package com.fruito.backend.dto.cart;

import java.util.List;

public class CartResponse {

    private final Long id;
    private final List<CartItemResponse> items;

    public CartResponse(Long id, List<CartItemResponse> items) {
        this.id = id;
        this.items = items;
    }

    public Long getId() {
        return id;
    }

    public List<CartItemResponse> getItems() {
        return items;
    }
}
