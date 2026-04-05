package com.fruito.backend.controller.admin;

import com.fruito.backend.dto.order.AdminOrderResponse;
import com.fruito.backend.model.OrderStatus;
import com.fruito.backend.service.OrderService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/orders")
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrderController {

    private final OrderService orderService;

    public AdminOrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /** GET /admin/orders */
    @GetMapping
    public List<AdminOrderResponse> getAllOrders() {
        return orderService.getAllOrdersForAdmin();
    }

    /** PUT /admin/orders/{id}/status?status=CONFIRMED */
    @PutMapping("/{id}/status")
    public AdminOrderResponse updateStatus(@PathVariable Long id,
                              @RequestParam OrderStatus status) {
        return orderService.updateStatusAndReturn(id, status);
    }

    /**
     * PUT /admin/orders/{id}/delivery-date
     * Body: { "deliveryAt": "2026-03-17T14:30:00" }
     * Saves estimated delivery datetime for the order.
     */
    @PutMapping("/{id}/delivery-date")
    public ResponseEntity<Map<String, String>> setDeliveryDate(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime deliveryAt) {
        orderService.setDeliveryDate(id, deliveryAt);
        return ResponseEntity.ok(Map.of("message", "Delivery date updated"));
    }

    /**
     * PUT /admin/orders/{id}/payment-status?paymentStatus=PAID
     * Lets admin manually mark a COD order as PAID (or revert to PENDING/FAILED).
     */
    @PutMapping("/{id}/payment-status")
    public AdminOrderResponse updatePaymentStatus(@PathVariable Long id,
                                                  @RequestParam String paymentStatus) {
        return orderService.updatePaymentStatusAndReturn(id, paymentStatus);
    }
}
