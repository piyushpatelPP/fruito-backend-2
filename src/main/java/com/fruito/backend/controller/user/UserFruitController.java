package com.fruito.backend.controller.user;

import com.fruito.backend.dto.product.FruitResponse;
import com.fruito.backend.service.FruitService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

// No class-level @PreAuthorize — GET endpoints are public (guests can browse).
// The SecurityConfig URL rules still protect all other /user/** routes.
@RestController
@RequestMapping("/user/fruits")
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
