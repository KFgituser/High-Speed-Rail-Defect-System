package com.bjtu.raillinebackend.controller;

import com.bjtu.raillinebackend.entity.user;
import com.bjtu.raillinebackend.repository.UserRepository;
import com.bjtu.raillinebackend.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class LoginController {

    private final JwtUtil jwt;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public LoginController(JwtUtil jwt, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.jwt = jwt;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/api/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String username = body.getOrDefault("username", "").trim();
        String password = body.getOrDefault("password", "");

        user loginUser = userRepository.findByUsername(username).orElse(null);
        if (loginUser == null || !passwordEncoder.matches(password, loginUser.getPassword())) {
            return ResponseEntity.status(401).body(Map.of("msg", "Invalid username or password"));
        }

        String role = loginUser.getRole() == null || loginUser.getRole().isBlank() ? "USER" : loginUser.getRole();
        String token = jwt.generate(username, Map.of("role", role));

        return ResponseEntity.ok(Map.of(
                "token", token,
                "username", username,
                "role", role
        ));
    }
}
