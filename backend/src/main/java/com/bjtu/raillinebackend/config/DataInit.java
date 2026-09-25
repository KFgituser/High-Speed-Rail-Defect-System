package com.bjtu.raillinebackend.config;

import com.bjtu.raillinebackend.entity.User;
import com.bjtu.raillinebackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInit {
    @Bean
    CommandLineRunner initializeAdministrator(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.init-admin.enabled:false}") boolean enabled,
            @Value("${app.init-admin.username:}") String username,
            @Value("${app.init-admin.password:}") String password) {
        return args -> {
            if (!enabled || username == null || username.isBlank() || password == null || password.isBlank()) {
                return;
            }
            if (!userRepository.existsByUsername(username.trim())) {
                User user = new User();
                user.setUsername(username.trim());
                user.setPassword(passwordEncoder.encode(password));
                user.setRole("ADMIN");
                userRepository.save(user);
            }
        };
    }
}
