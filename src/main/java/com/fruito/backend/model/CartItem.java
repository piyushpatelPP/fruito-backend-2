package com.fruito.backend.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

@Entity
@Table(name = "cart_items")
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonBackReference // 🔴 STOP CartItem → Cart → CartItem loop
    @ManyToOne
    @JoinColumn(name = "cart_id")
    private Cart cart;

    @ManyToOne
    @JoinColumn(name = "fruit_id")
    private Fruit fruit;

    @Column(nullable = false)
    private int quantity;

    public CartItem() {}

    public CartItem(Cart cart, Fruit fruit, int quantity) {
        this.cart = cart;
        this.fruit = fruit;
        this.quantity = quantity;
    }

    public Long getId() { return id; }
    public Cart getCart() { return cart; }
    public Fruit getProduct() { return fruit; }
    public int getQuantity() { return quantity; }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }
}
