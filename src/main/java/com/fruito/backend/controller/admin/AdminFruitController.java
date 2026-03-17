package com.fruito.backend.controller.admin;

import com.fruito.backend.dto.product.FruitRequest;
import com.fruito.backend.dto.product.FruitResponse;
import com.fruito.backend.service.FruitService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/fruits")
@PreAuthorize("hasRole('ADMIN')")
public class AdminFruitController {

    private final FruitService fruitService;

    public AdminFruitController(FruitService fruitService) {
        this.fruitService = fruitService;
    }

    @PostMapping
    public FruitResponse create(@RequestBody FruitRequest request) {
        return fruitService.create(request);
    }

    @PutMapping("/{id}")
    public FruitResponse update(
            @PathVariable Long id,
            @RequestBody FruitRequest request
    ) {
        return fruitService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        fruitService.delete(id);
    }
}
