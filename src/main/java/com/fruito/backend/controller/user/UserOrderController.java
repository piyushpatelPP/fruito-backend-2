package com.fruito.backend.controller.user;

import com.fruito.backend.dto.order.OrderResponse;
import com.fruito.backend.dto.order.RazorpayOrderResponse;
import com.fruito.backend.dto.order.RazorpayVerifyRequest;
import com.fruito.backend.service.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/user/orders")
public class UserOrderController {

    private final OrderService orderService;

    public UserOrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /** GET /user/orders — list user's own orders */
    @GetMapping
    public List<OrderResponse> myOrders(Authentication auth) {
        return orderService.getUserOrderResponsesByEmail(auth.getName());
    }

    /**
     * POST /user/orders/initiate
     * Creates a Razorpay Order and returns the order ID + amount in paise.
     * Frontend uses this to open the Razorpay Checkout modal.
     */
    @PostMapping("/initiate")
    public ResponseEntity<RazorpayOrderResponse> initiatePayment(
            Authentication auth,
            @RequestParam(required = false) String couponCode) {
        RazorpayOrderResponse resp = orderService.initiateRazorpayOrder(auth.getName(), couponCode);
        return ResponseEntity.ok(resp);
    }

    /**
     * POST /user/orders/verify
     * Verifies Razorpay HMAC signature server-side.
     * Only on success does the order get committed to the database.
     */
    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyPayment(
            Authentication auth,
            @RequestBody RazorpayVerifyRequest req,
            @RequestParam(required = false) String couponCode) {
        OrderResponse order = orderService.verifyAndPlaceOrder(auth.getName(), req, couponCode);
        return ResponseEntity.ok(Map.of("success", true, "order", order));
    }

    /** POST /user/orders/place — legacy cash/COD endpoint */
    @PostMapping("/place")
    public OrderResponse place(Authentication auth,
                               @RequestParam(required = false) String couponCode) {
        return orderService.placeOrder(auth.getName(), couponCode);
    }
}
