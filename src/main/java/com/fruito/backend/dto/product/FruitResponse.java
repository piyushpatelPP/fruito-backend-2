package com.fruito.backend.dto.product;

public class FruitResponse {

    private Long id;
    private String name;
    private Double price;
    private String description;
    private String imageUrl;
    private int stock;
    private String category;

    public FruitResponse(Long id, String name, Double price, String description,
                         String imageUrl, int stock, String category) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.description = description;
        this.imageUrl = imageUrl;
        this.stock = stock;
        this.category = category;
    }

    // ===== GETTERS =====
    public Long getId() { return id; }
    public String getName() { return name; }
    public Double getPrice() { return price; }
    public String getDescription() { return description; }
    public String getImageUrl() { return imageUrl; }
    public int getStock() { return stock; }
    public String getCategory() { return category; }
}
