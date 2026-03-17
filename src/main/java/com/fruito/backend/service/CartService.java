package com.fruito.backend.service;

import com.fruito.backend.dto.cart.CartItemResponse;
import com.fruito.backend.dto.cart.CartResponse;
import com.fruito.backend.dto.product.FruitResponse;
import com.fruito.backend.model.Cart;
import com.fruito.backend.model.CartItem;
import com.fruito.backend.model.Fruit;
import com.fruito.backend.model.User;
import com.fruito.backend.repository.CartRepository;
import com.fruito.backend.repository.FruitRepository;
import com.fruito.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

@Service
@Transactional
public class CartService {

    private final CartRepository cartRepo;
    private final FruitRepository productRepo;
    private final UserRepository userRepo;

    public CartService(
            CartRepository cartRepo,
            FruitRepository productRepo,
            UserRepository userRepo
    ) {
        this.cartRepo = cartRepo;
        this.productRepo = productRepo;
        this.userRepo = userRepo;
    }

    /* ================= ENTITY METHODS ================= */

    public Cart getOrCreateCart(User user) {
        if (user == null) {
            throw new IllegalArgumentException("User cannot be null");
        }
        return cartRepo.findByUser(user)
                .orElseGet(() -> cartRepo.save(new Cart(user)));
    }

    /* ================= API METHODS ================= */

    public CartResponse addProductByEmail(String email, Long productId, int qty) {

        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Cart cart = getOrCreateCart(user);

        Fruit fruit = productRepo.findById(productId)
                .orElseThrow(() -> new RuntimeException("Fruit not found"));

        for (CartItem i : cart.getItems()) {
            if (i.getProduct().getId().equals(productId)) {
                i.setQuantity(i.getQuantity() + qty);
                return toResponse(cart);
            }
        }

        cart.getItems().add(new CartItem(cart, fruit, qty));

        return toResponse(cart);
    }

    public CartResponse updateQuantity(User user, Long productId, int qty) {

        Cart cart = getOrCreateCart(user);

        cart.getItems().removeIf(i -> {
            if (i.getProduct().getId().equals(productId)) {
                if (qty <= 0) return true;
                i.setQuantity(qty);
            }
            return false;
        });

        return toResponse(cart);
    }

    public CartResponse getCart(User user) {
        return toResponse(getOrCreateCart(user));
    }

    public void clearCart(Cart cart) {
        cart.getItems().clear();
        cartRepo.save(cart);
    }

    /* ================= MAPPER ================= */

    private CartResponse toResponse(Cart cart) {
        return new CartResponse(
                cart.getId(),
                cart.getItems().stream()
                        .map(i -> new CartItemResponse(
                                i.getId(),
                                new FruitResponse(
                                        i.getProduct().getId(),
                                        i.getProduct().getName(),
                                        i.getProduct().getPrice(),
                                        i.getProduct().getDescription(),
                                        i.getProduct().getImageUrl(),
                                        i.getProduct().getStock(),
                                        i.getProduct().getCategory()
                                ),
                                i.getQuantity()
                        ))
                        .toList()
        );
    }
}
