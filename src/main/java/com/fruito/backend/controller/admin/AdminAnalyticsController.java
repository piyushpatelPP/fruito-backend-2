package com.fruito.backend.controller.admin;

import com.fruito.backend.service.AnalyticsService;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/admin/analytics")
public class AdminAnalyticsController {
    private final AnalyticsService analyticsService;

    public AdminAnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        return analyticsService.getDashboardStats();
    }
}
