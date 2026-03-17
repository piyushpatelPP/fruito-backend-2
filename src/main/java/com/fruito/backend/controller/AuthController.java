package com.fruito.backend.controller;

import com.fruito.backend.dto.*;
import com.fruito.backend.model.Role;
import com.fruito.backend.service.AuthService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.annotation.security.PermitAll;


@RestController
@RequestMapping("/auth")
@PermitAll
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    public void signup(@RequestBody SignupRequest request) {
        authService.signup(request);
    }

    @PostMapping("/login")
    public JwtResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    /**
     * Admin-only endpoint to create another admin account.
     * First admin must be promoted manually via DB.
     */
    @PostMapping("/admin/signup")
    @PreAuthorize("hasRole('ADMIN')")
    public void signupAdmin(@RequestBody SignupRequest request) {
        authService.signup(request, Role.ADMIN);
    }
}
