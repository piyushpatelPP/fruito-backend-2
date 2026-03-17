package com.fruito.backend.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private final Map<String, Bucket> authBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> orderBuckets = new ConcurrentHashMap<>();

    // 10 requests per minute for Auth
    private Bucket createNewAuthBucket() {
        Bandwidth limit = Bandwidth.simple(10, Duration.ofMinutes(1));
        return Bucket.builder().addLimit(limit).build();
    }

    // 5 requests per minute for Orders
    private Bucket createNewOrderBucket() {
        Bandwidth limit = Bandwidth.simple(5, Duration.ofMinutes(1));
        return Bucket.builder().addLimit(limit).build();
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        String ip = request.getRemoteAddr();

        // Rate limit Auth endpoints
        if (path.startsWith("/auth/")) {
            Bucket bucket = authBuckets.computeIfAbsent(ip, k -> createNewAuthBucket());
            if (!bucket.tryConsume(1)) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.getWriter().write("Too many requests to authentication endpoint. Please try again later.");
                return;
            }
        }

        // Rate limit Order creation endpoint
        if (path.startsWith("/user/orders") && request.getMethod().equalsIgnoreCase("POST")) {
            Bucket bucket = orderBuckets.computeIfAbsent(ip, k -> createNewOrderBucket());
            if (!bucket.tryConsume(1)) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.getWriter().write("Too many order requests. Please try again later.");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
