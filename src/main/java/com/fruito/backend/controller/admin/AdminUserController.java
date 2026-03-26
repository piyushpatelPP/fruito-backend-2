package com.fruito.backend.controller.admin;

import com.fruito.backend.dto.user.UserResponse;
import com.fruito.backend.repository.UserRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserRepository userRepository;

    public AdminUserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(user -> new UserResponse(
                        user.getId(),
                        user.getEmail(),
                        user.getRole().name()
                ))
                .collect(Collectors.toList());
    }

    @DeleteMapping("/{id}")
    @SuppressWarnings("null")
    public void deleteUser(@PathVariable("id") Long id) {
        userRepository.deleteById(id);
    }
}
