package com.bjtu.raillinebackend.security;



import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.List;

@Component                //  让它被扫描成 Bean
@RequiredArgsConstructor  // 自动注入 final 字段 JwtUtil

public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtUtil jwt;


    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String auth = req.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            String token = auth.substring(7);
            try {
                var jws = jwt.parse(token);
                String username = jws.getBody().getSubject();
                String role = (String) jws.getBody().getOrDefault("role", "ADMIN");
                var authToken = new UsernamePasswordAuthenticationToken(
                        username, null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            } catch (Exception ignored) { /* 无效 token -> 不设认证 */ }
        }
        chain.doFilter(req, res);
    }

}
