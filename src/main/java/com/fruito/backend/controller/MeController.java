package com.fruito.backend.controller;

import com.fruito.backend.model.User;
import com.fruito.backend.service.UserService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class MeController {

    private final UserService userService;

    public MeController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public Map<String, Object> me() {

        User user = userService.getCurrentUser();

        return Map.of(
                "email", user.getEmail(),
                "role", user.getRole().name()
        );
    }

}
