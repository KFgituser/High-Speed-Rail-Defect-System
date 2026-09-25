package com.bjtu.raillinebackend.security;

import com.bjtu.raillinebackend.entity.User;
import com.bjtu.raillinebackend.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DatabaseUserDetailsService implements UserDetailsService {
    private final UserRepository userRepository;

    public DatabaseUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User databaseUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Invalid username or password"));
        String role = databaseUser.getRole() == null || databaseUser.getRole().isBlank()
                ? "USER" : databaseUser.getRole().trim().toUpperCase();
        return org.springframework.security.core.userdetails.User.withUsername(databaseUser.getUsername())
                .password(databaseUser.getPassword())
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_" + role)))
                .build();
    }
}
