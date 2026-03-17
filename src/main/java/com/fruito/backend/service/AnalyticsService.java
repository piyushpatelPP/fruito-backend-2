package com.fruito.backend.service;

import com.fruito.backend.repository.OrderRepository;
import com.fruito.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;
import java.util.List;

@Service
public class AnalyticsService {
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    public AnalyticsService(OrderRepository orderRepository, UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
    }

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalOrders", orderRepository.count());
        
        Double revenue = orderRepository.sumTotalAmount();
        stats.put("totalRevenue", revenue != null ? revenue : 0.0);

        List<Object[]> topFruits = orderRepository.findTopSellingFruits();
        stats.put("topSellingFruits", topFruits); 
        
        return stats;
    }
}
