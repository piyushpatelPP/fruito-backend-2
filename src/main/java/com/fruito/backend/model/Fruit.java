package com.fruito.backend.model;

import jakarta.persistence.*;

@Entity
public class Fruit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private double price;

    @Column(name = "price_per_half_kg")
    private Double pricePerHalfKg;

    private String description;

    @Column(name = "stock", columnDefinition = "integer default 0")
    private int stock = 0;

    private String category;

    @Column(name = "image_url")
    private String imageUrl;


    // ===== GETTERS =====
    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public double getPrice() {
        return price;
    }

    public Double getPricePerHalfKg() {
        return pricePerHalfKg;
    }

    public String getDescription() {
        return description;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public int getStock() {
        return stock;
    }

    public String getCategory() {
        return category;
    }

    // ===== SETTERS =====
    public void setId(Long id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setPrice(double price) {
        this.price = price;
    }

    public void setPricePerHalfKg(Double pricePerHalfKg) {
        this.pricePerHalfKg = pricePerHalfKg;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public void setStock(int stock) {
        this.stock = stock;
    }

    public void setCategory(String category) {
        this.category = category;
    }
}