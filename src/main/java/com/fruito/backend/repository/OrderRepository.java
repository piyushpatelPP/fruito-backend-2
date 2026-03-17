package com.fruito.backend.repository;

import com.fruito.backend.model.Order;
import com.fruito.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUser(User user);

    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.status = 'DELIVERED'")
    Double sumTotalAmount();

    @Query("SELECT oi.fruit.name, SUM(oi.quantity) as total_qty FROM OrderItem oi GROUP BY oi.fruit.name ORDER BY total_qty DESC")
    List<Object[]> findTopSellingFruits();

    // Count how many orders a user has placed (used to generate per-user sequential order numbers)
    @Query("SELECT COUNT(o) FROM Order o WHERE o.user = :user AND o.id < :orderId")
    long countByUserBeforeOrder(@Param("user") User user, @Param("orderId") Long orderId);
}
