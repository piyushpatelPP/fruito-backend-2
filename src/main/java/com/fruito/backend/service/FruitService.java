package com.fruito.backend.service;

import com.fruito.backend.dto.product.FruitRequest;
import com.fruito.backend.dto.product.FruitResponse;
import com.fruito.backend.model.Fruit;
import com.fruito.backend.repository.FruitRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class FruitService {

    private final FruitRepository fruitRepository;

    public FruitService(FruitRepository fruitRepository) {
        this.fruitRepository = fruitRepository;
    }

    // ADMIN
    public FruitResponse create(FruitRequest request) {
        Fruit fruit = new Fruit();
        fruit.setName(request.getName());
        fruit.setPrice(request.getPrice());
        fruit.setPricePerHalfKg(request.getPricePerHalfKg());
        fruit.setDescription(request.getDescription());
        fruit.setImageUrl(request.getImageUrl());
        fruit.setStock(request.getStock());
        fruit.setCategory(request.getCategory());
        return mapToResponse(fruitRepository.save(fruit));
    }

    @SuppressWarnings("null")
    public FruitResponse update(Long id, FruitRequest request) {
        Fruit fruit = fruitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Fruit not found"));

        fruit.setName(request.getName());
        fruit.setPrice(request.getPrice());
        fruit.setPricePerHalfKg(request.getPricePerHalfKg());
        fruit.setDescription(request.getDescription());
        fruit.setImageUrl(request.getImageUrl());
        fruit.setStock(request.getStock());
        fruit.setCategory(request.getCategory());

        return mapToResponse(fruitRepository.save(fruit));
    }

    @SuppressWarnings("null")
    public void delete(Long id) {
        fruitRepository.deleteById(id);
    }

    // USER + ADMIN
    @SuppressWarnings("null")
    public Page<FruitResponse> getAll(Pageable pageable) {
        return fruitRepository.findAll(pageable)
                .map(this::mapToResponse);
    }

    @SuppressWarnings("null")
    public FruitResponse getById(Long id) {
        return fruitRepository.findById(id)
                .map(this::mapToResponse)
                .orElseThrow(() -> new RuntimeException("Fruit not found"));
    }

    // 🔁 Mapper
    private FruitResponse mapToResponse(Fruit fruit) {
        return new FruitResponse(
                fruit.getId(),
                fruit.getName(),
                fruit.getPrice(),
                fruit.getPricePerHalfKg(),
                fruit.getDescription(),
                fruit.getImageUrl(),
                fruit.getStock(),
                fruit.getCategory()
        );
    }
}
