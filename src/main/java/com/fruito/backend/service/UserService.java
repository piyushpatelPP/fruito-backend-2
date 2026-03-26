package com.fruito.backend.service;

import com.fruito.backend.model.User;
import com.fruito.backend.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;



@Service
public class UserService {

    private final UserRepository repo;

    public UserService(UserRepository repo) {
        this.repo = repo;
    }

    public User getCurrentUser() {
        Authentication auth = SecurityContextHolder
                .getContext()
                .getAuthentication();

        String email = auth.getName();

        return repo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
