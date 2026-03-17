package com.fruito.backend.controller.user;

import com.fruito.backend.dto.product.FruitResponse;
import com.fruito.backend.service.FruitService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user/fruits")
@PreAuthorize("hasAnyRole('USER','ADMIN')")
public class UserFruitController {

    private final FruitService fruitService;

    public UserFruitController(FruitService fruitService) {
        this.fruitService = fruitService;
    }

    @GetMapping
    public Page<FruitResponse> getAll(Pageable pageable) {
        return fruitService.getAll(pageable);
    }

    @GetMapping("/{id}")
    public FruitResponse getById(@PathVariable Long id) {
        return fruitService.getById(id);
    }
}
