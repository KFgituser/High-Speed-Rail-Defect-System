package com.bjtu.raillinebackend.config;

import com.bjtu.raillinebackend.security.JwtAuthFilter;
import com.bjtu.raillinebackend.security.JwtUtil;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;


import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(    // ← 一定要有
        jsr250Enabled = true, // 让 @PermitAll/@RolesAllowed 生效
        prePostEnabled = true,
        securedEnabled = true
)
public class SecurityConfig {
    @Bean
    public JwtUtil jwtUtil(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expire-minutes}") long expireMinutes) {
        return new JwtUtil(secret, expireMinutes);
    }
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtAuthFilter jwtAuthFilter) throws Exception {
        http
                // 前后端分离常用：禁用 CSRF、允许 CORS、无状态会话
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 关键：关闭 Basic 和表单登录，避免浏览器弹系统登录框
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)

                // 路由授权：把会被前端直接访问的资源/接口放行
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/", "/index.html", "/favicon.ico",
                                "/assets/**", "/static/**",
                                "/data/**", "/data/runs/**"
                        ).permitAll()
                        // 先放行查询接口（等接入登录/JWT 再收紧）
                        .requestMatchers("/api/**").permitAll()
                        .requestMatchers("/viz-out/**","/output/").permitAll()
                        .requestMatchers("/error", "/error/**").permitAll()  // 图像文件文件放行
                        .requestMatchers(HttpMethod.POST, "/api/viz/run3d", "/api/run3d/**").permitAll()
                        .requestMatchers("/output/**").permitAll() // 需要登录
                        //  放行文件筛选和分析接口
                        .requestMatchers("/api/files", "/api/analyze").permitAll()
                        // 放行静态资源（缩略图、分析结果图）
                        .requestMatchers("/thumbs/**", "/plots/**").permitAll()

                        .requestMatchers("/api/slots/**").permitAll()
                        // 分析结果查询/保存 放行
                        .requestMatchers("/api/analysis-results/**").permitAll()

                        // 其它接口默认要求认证
                        .anyRequest().authenticated()
                )

                // 自定义 401：返回 JSON，不返回 WWW-Authenticate 头（否则浏览器会弹窗）
                .exceptionHandling(ex -> ex.authenticationEntryPoint((req, res, e) -> {
                    res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    res.setContentType("application/json;charset=UTF-8");
                    res.getWriter().write("{\"code\":401,\"msg\":\"Unauthorized\"}");
                }));
        http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    // CORS：允许 http://localhost:3000、5173 调用后端
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(List.of("http://localhost:3000", "http://localhost:5173"));
        cfg.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS"));
        cfg.setAllowedHeaders(List.of("*"));
        cfg.setAllowCredentials(true);  //允许带cookies
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }
}
