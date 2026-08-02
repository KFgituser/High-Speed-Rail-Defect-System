package com.bjtu.raillinebackend.controller;



import com.bjtu.raillinebackend.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
public class LoginController {

    private final JwtUtil jwt;

    public LoginController(JwtUtil jwt) { this.jwt = jwt; }

    @PostMapping("/api/login")
    public ResponseEntity<?> login(@RequestBody Map<String,String> body) {
        String username = body.getOrDefault("username", "");
        String password = body.getOrDefault("password", "");

        // DEMO：写死的校验；真实项目请查数据库/用户服务
        if (!"admin".equals(username) || !"admin123".equals(password)) {
            return ResponseEntity.status(401).body(Map.of("msg", "用户名或密码错误"));
        }

        String token = jwt.generate(username, Map.of("role", "ADMIN"));
        return ResponseEntity.ok(Map.of(
                "token", token,
                "username", username,
                "role", "ADMIN"
        ));
    }
}
