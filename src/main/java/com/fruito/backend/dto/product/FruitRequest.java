package com.fruito.backend.dto.product;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class FruitRequest {

    @NotBlank
    private String name;

    @NotNull
    @Min(0)
    private Double price;

    private String description;
    private String imageUrl;

    @Min(0)
    private int stock;

    private String category;

    // ===== GETTERS =====
    public String getName() { return name; }
    public Double getPrice() { return price; }
    public String getDescription() { return description; }
    public String getImageUrl() { return imageUrl; }
    public int getStock() { return stock; }
    public String getCategory() { return category; }

    // ===== SETTERS =====
    public void setName(String name) { this.name = name; }
    public void setPrice(Double price) { this.price = price; }
    public void setDescription(String description) { this.description = description; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public void setStock(int stock) { this.stock = stock; }
    public void setCategory(String category) { this.category = category; }
}
