package com.fruito.backend.controller.user;

import com.fruito.backend.dto.cart.CartResponse;
import com.fruito.backend.model.User;
import com.fruito.backend.repository.UserRepository;
import com.fruito.backend.service.CartService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/user/cart")
public class UserCartController {

    private final CartService cartService;
    private final UserRepository userRepo;

    public UserCartController(CartService cartService, UserRepository userRepo) {
        this.cartService = cartService;
        this.userRepo = userRepo;
    }

    private User getUser(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @PostMapping("/add")
    public CartResponse add(
            Authentication auth,
            @RequestParam Long productId,
            @RequestParam int quantity
    ) {
        return cartService.addProductByEmail(auth.getName(), productId, quantity);
    }

    @PutMapping("/update")
    public CartResponse update(
            Authentication auth,
            @RequestParam Long productId,
            @RequestParam int quantity
    ) {
        return cartService.updateQuantity(getUser(auth.getName()), productId, quantity);
    }

    @GetMapping
    public CartResponse view(Authentication auth) {
        return cartService.getCart(getUser(auth.getName()));
    }

    @DeleteMapping("/clear")
    public void clear(Authentication auth) {
        User user = getUser(auth.getName());
        cartService.clearCart(cartService.getOrCreateCart(user));
    }
}
