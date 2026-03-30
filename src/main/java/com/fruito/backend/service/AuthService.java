package com.fruito.backend.service;

import com.fruito.backend.config.JwtUtil;
import com.fruito.backend.dto.JwtResponse;
import com.fruito.backend.dto.LoginRequest;
import com.fruito.backend.dto.SignupRequest;
import com.fruito.backend.model.Role;
import com.fruito.backend.model.User;
import com.fruito.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepo;
    private final PasswordEncoder encoder;
    private final JwtUtil jwtUtil;
    private final RecaptchaService recaptchaService;

    public AuthService(UserRepository userRepo,
                       PasswordEncoder encoder,
                       JwtUtil jwtUtil,
                       RecaptchaService recaptchaService) {
        this.userRepo = userRepo;
        this.encoder = encoder;
        this.jwtUtil = jwtUtil;
        this.recaptchaService = recaptchaService;
    }

    public void signup(SignupRequest req) {
        signup(req, Role.USER);
    }

    public void signup(SignupRequest req, Role role) {
        if (!recaptchaService.verifyCaptcha(req.getCaptchaToken())) {
            throw new RuntimeException("Invalid reCAPTCHA");
        }
        if (userRepo.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        User user = new User();
        user.setEmail(req.getEmail());
        user.setPassword(encoder.encode(req.getPassword()));
        user.setRole(role);
        if (req.getPhone() != null && !req.getPhone().isBlank()) user.setPhone(req.getPhone());
        if (req.getAddress() != null && !req.getAddress().isBlank()) user.setAddress(req.getAddress());
        userRepo.save(user);
    }

    public JwtResponse login(LoginRequest req) {
        User user = userRepo.findByEmail(req.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!encoder.matches(req.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
        return new JwtResponse(token, user.getEmail(), user.getRole().name(), user.getId());
    }
}
