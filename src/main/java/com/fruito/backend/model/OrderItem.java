package com.fruito.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Parent order
    @ManyToOne
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    // Fruit
    @ManyToOne
    @JoinColumn(name = "fruit_id", nullable = false)
    private Fruit fruit;

    @Column(nullable = false)
    private int quantity;

    public OrderItem() {}

    public OrderItem(Order order, Fruit fruit, int quantity) {
        this.order = order;
        this.fruit = fruit;
        this.quantity = quantity;
    }

    // getters
    public Long getId() { return id; }
    public Order getOrder() { return order; }
    public Fruit getProduct() { return fruit; }
    public int getQuantity() { return quantity; }
}
