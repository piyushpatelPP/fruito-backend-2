package com.fruito.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @JsonIgnore   // 🔴 CRITICAL: never expose password
    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    private Role role;

    /** Optional — user fills in after registration */
    @Column(nullable = true)
    private String phone;

    /** Delivery address — stored and shown to admin on orders */
    @Column(nullable = true, length = 500)
    private String address;

    // ===== GETTERS & SETTERS =====

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
}
