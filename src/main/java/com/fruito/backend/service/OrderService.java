package com.fruito.backend.service;

import com.fruito.backend.dto.order.AdminOrderResponse;
import com.fruito.backend.dto.order.OrderItemResponse;
import com.fruito.backend.dto.order.OrderResponse;
import com.fruito.backend.dto.order.RazorpayOrderResponse;
import com.fruito.backend.dto.order.RazorpayVerifyRequest;
import com.fruito.backend.dto.product.FruitResponse;
import com.fruito.backend.model.*;
import com.fruito.backend.repository.OrderRepository;
import com.fruito.backend.repository.UserRepository;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class OrderService {

    private final OrderRepository orderRepo;
    private final CartService cartService;
    private final UserRepository userRepo;
    private final SettingService settingService;
    private final CouponService couponService;

    @Value("${razorpay.key-id}")
    private String keyId;

    @Value("${razorpay.key-secret}")
    private String keySecret;

    public OrderService(OrderRepository orderRepo, CartService cartService,
                        UserRepository userRepo, SettingService settingService,
                        CouponService couponService) {
        this.orderRepo = orderRepo;
        this.cartService = cartService;
        this.userRepo = userRepo;
        this.settingService = settingService;
        this.couponService = couponService;
    }

    // ─── Compute discount helper ─────────────────────────────────────────────
    private double computeDiscount(double subtotal, String couponCode) {
        if (couponCode == null || couponCode.isEmpty()) return 0.0;
        return couponService.findByCode(couponCode)
                .map(c -> {
                    if (!c.isActive()) return 0.0;
                    if (subtotal < c.getMinOrderValue()) return 0.0;
                    double d = (subtotal * c.getDiscountPercentage()) / 100.0;
                    if (c.getMaxDiscount() != null && d > c.getMaxDiscount()) d = c.getMaxDiscount();
                    return d;
                })
                .orElse(0.0);
    }

    // ─── Step 1: Initiate Razorpay Order ─────────────────────────────────────
    /**
     * Creates a Razorpay order for the current user's cart contents.
     * The actual DB Order is NOT created here — it's created after payment is verified.
     */
    public RazorpayOrderResponse initiateRazorpayOrder(String email, String couponCode) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Cart cart = cartService.getOrCreateCart(user);
        if (cart.getItems().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cart is empty");
        }

        double subtotal = cart.getItems().stream()
                .mapToDouble(ci -> ci.getProduct().getPrice() * ci.getQuantity())
                .sum();

        double deliveryFee = Double.parseDouble(settingService.getDeliveryFee());
        double discount = computeDiscount(subtotal, couponCode);
        double grandTotal = Math.max(0, subtotal + deliveryFee - discount);

        // Razorpay works in paise (1 INR = 100 paise), must be integer
        long amountInPaise = Math.round(grandTotal * 100);

        try {
            RazorpayClient client = new RazorpayClient(keyId, keySecret);
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "fruito_" + email.hashCode() + "_" + System.currentTimeMillis());

            com.razorpay.Order razorpayOrder = client.orders.create(orderRequest);
            String razorpayOrderId = razorpayOrder.get("id");

            return new RazorpayOrderResponse(razorpayOrderId, amountInPaise, "INR");

        } catch (RazorpayException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Failed to create Razorpay order: " + e.getMessage());
        }
    }

    // ─── Step 2: Verify Payment + Place Order ────────────────────────────────
    /**
     * Verifies the Razorpay HMAC signature and — only if valid — creates the Order in DB.
     * This is the ONLY way an order gets committed, preventing payment bypass.
     */
    public OrderResponse verifyAndPlaceOrder(String email, RazorpayVerifyRequest req, String couponCode) {
        // HMAC-SHA256 signature verification
        try {
            JSONObject attributes = new JSONObject();
            attributes.put("razorpay_order_id", req.getRazorpayOrderId());
            attributes.put("razorpay_payment_id", req.getRazorpayPaymentId());
            attributes.put("razorpay_signature", req.getRazorpaySignature());
            Utils.verifyPaymentSignature(attributes, keySecret);
        } catch (RazorpayException e) {
            throw new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED,
                    "Payment signature verification failed. Do not retry — contact support.");
        }

        // Signature is valid — place the order
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Cart cart = cartService.getOrCreateCart(user);
        if (cart.getItems().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cart is empty");
        }

        double subtotal = cart.getItems().stream()
                .mapToDouble(ci -> ci.getProduct().getPrice() * ci.getQuantity())
                .sum();

        double deliveryFee = Double.parseDouble(settingService.getDeliveryFee());
        double discount = computeDiscount(subtotal, couponCode);

        Order order = new Order(user);
        order.setTotalAmount(Math.max(0, subtotal + deliveryFee - discount));
        order.setRazorpayOrderId(req.getRazorpayOrderId());
        order.setPaymentStatus("PAID");

        cart.getItems().forEach(ci ->
                order.getItems().add(new OrderItem(order, ci.getProduct(), ci.getQuantity()))
        );

        Order saved = orderRepo.save(order);
        cartService.clearCart(cart);

        return toOrderResponse(saved);
    }

    // ─── COD (Cash on Delivery) order placement ───────────────────────────────
    /**
     * POST /user/orders/place — used when payment method is Cash on Delivery.
     * No Razorpay involved; order is placed immediately with paymentStatus=COD_PENDING.
     * Admin can later mark it PAID via the admin dashboard.
     */
    public OrderResponse placeOrder(String email, String couponCode) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Cart cart = cartService.getOrCreateCart(user);
        if (cart.getItems().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cart is empty");
        }

        double subtotal = cart.getItems().stream()
                .mapToDouble(ci -> ci.getProduct().getPrice() * ci.getQuantity())
                .sum();

        double deliveryFee = Double.parseDouble(settingService.getDeliveryFee());
        // computeDiscount already checks minOrderValue — returns 0 if not met
        double discount = computeDiscount(subtotal, couponCode);

        Order order = new Order(user);
        order.setTotalAmount(Math.max(0, subtotal + deliveryFee - discount));
        order.setPaymentStatus("COD_PENDING");  // distinguishable from online PENDING
        order.setRazorpayOrderId(null);          // no Razorpay for COD

        cart.getItems().forEach(ci ->
                order.getItems().add(new OrderItem(order, ci.getProduct(), ci.getQuantity()))
        );

        Order saved = orderRepo.save(order);
        cartService.clearCart(cart);
        return toOrderResponse(saved);
    }

    // ─── Admin: update delivery date ─────────────────────────────────────────
    @SuppressWarnings("null")
    public Order setDeliveryDate(Long orderId, LocalDateTime deliveryAt) {
        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        order.setEstimatedDeliveryAt(deliveryAt);
        return order;
    }

    // ─── Queries ─────────────────────────────────────────────────────────────
    public List<Order> getUserOrders(User user) { return orderRepo.findByUser(user); }
    public List<Order> getAllOrders() { return orderRepo.findAll(); }

    @SuppressWarnings("null")
    public Order updateStatus(Long id, OrderStatus status) {
        Order order = orderRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        order.setStatus(status);
        return order;
    }

    /** Used by AdminOrderController — returns DTO to avoid lazy-loading serialization errors */
    public AdminOrderResponse updateStatusAndReturn(Long id, OrderStatus status) {
        Order order = updateStatus(id, status);
        return mapToAdminResponse(order);
    }

    /** Admin: manually update payment status (e.g. mark COD order as PAID) */
    @SuppressWarnings("null")
    public AdminOrderResponse updatePaymentStatusAndReturn(Long id, String paymentStatus) {
        Order order = orderRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        order.setPaymentStatus(paymentStatus.toUpperCase());
        return mapToAdminResponse(order);
    }

    private long getUserOrderNumber(Order order) {
        return orderRepo.countByUserBeforeOrder(order.getUser(), order.getId()) + 1;
    }

    private FruitResponse mapFruit(Fruit fruit) {
        return new FruitResponse(fruit.getId(), fruit.getName(), fruit.getPrice(),
                fruit.getDescription(), fruit.getImageUrl(), fruit.getStock(), fruit.getCategory());
    }

    private OrderResponse toOrderResponse(Order order) {
        List<OrderItemResponse> items = order.getItems().stream()
                .map(item -> new OrderItemResponse(item.getId(), mapFruit(item.getProduct()), item.getQuantity()))
                .toList();

        return new OrderResponse(
                getUserOrderNumber(order),
                order.getStatus().name(),
                order.getTotalAmount(),
                order.getCreatedAt().toString(),
                items
        );
    }

    private AdminOrderResponse mapToAdminResponse(Order order) {
        List<OrderItemResponse> items = order.getItems().stream()
                .map(item -> new OrderItemResponse(item.getId(), mapFruit(item.getProduct()), item.getQuantity()))
                .toList();

        return new AdminOrderResponse(
                order.getId(),
                order.getStatus().name(),
                order.getPaymentStatus(),
                order.getUser().getId(),
                order.getUser().getEmail(),
                order.getUser().getPhone(),    // ← delivery contact
                order.getUser().getAddress(),  // ← delivery address
                order.getTotalAmount(),
                order.getCreatedAt().toString(),
                order.getEstimatedDeliveryAt() != null ? order.getEstimatedDeliveryAt().toString() : null,
                items
        );
    }

    public List<OrderResponse> getUserOrderResponsesByEmail(String email) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return orderRepo.findByUser(user).stream().map(this::toOrderResponse).toList();
    }

    public List<OrderResponse> getAllOrderResponses() {
        return orderRepo.findAll().stream().map(this::toOrderResponse).toList();
    }

    public List<AdminOrderResponse> getAllOrdersForAdmin() {
        return orderRepo.findAll().stream().map(this::mapToAdminResponse).toList();
    }
}
