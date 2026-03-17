package com.fruito.backend.dto;

public class JwtResponse {

    private String token;
    private String email;
    private String role;
    private Long userId;

    // Backward-compatible constructor (token only)
    public JwtResponse(String token) {
        this.token = token;
    }

    // Full constructor with user info
    public JwtResponse(String token, String email, String role, Long userId) {
        this.token = token;
        this.email = email;
        this.role = role;
        this.userId = userId;
    }

    public String getToken() { return token; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public Long getUserId() { return userId; }
}
