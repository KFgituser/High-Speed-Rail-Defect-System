package com.bjtu.raillinebackend.config;

import java.util.List;

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
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.bjtu.raillinebackend.security.JwtAuthFilter;
import com.bjtu.raillinebackend.security.JwtUtil;

import jakarta.servlet.http.HttpServletResponse;


/*
* 负责“认证/权限”   “谁能访问 + 如何认证 + 没权限怎么办”。
* */


@Configuration  //配置类，会提供 @Bean。
@EnableWebSecurity  //开启 Spring Security 的 Web 安全支持（让 SecurityFilterChain 生效）。
@EnableMethodSecurity(    //配置类，会提供 @Bean
        jsr250Enabled = true, // 让 @PermitAll/@RolesAllowed 生效
        prePostEnabled = true, //让 @PreAuthorize, @PostAuthorize 生效
        securedEnabled = true   //让 @Secured 生效
)
public class SecurityConfig {
    @Bean
    public JwtUtil jwtUtil(
            @Value("${app.jwt.secret}") String secret,  // JWT 签名密钥
            @Value("${app.jwt.expire-minutes}") long expireMinutes) {       // 过期时间
        return new JwtUtil(secret, expireMinutes);
    }
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtAuthFilter jwtAuthFilter) throws Exception {
        http
                // 前后端分离常用：禁用 CSRF、允许 CORS、无状态会话
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                //STATELESS 不创建/不使用 HttpSession；每个请求独立认证
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 关键：关闭 Basic 和表单登录，避免浏览器弹系统登录框
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)

                // URL授权规则、路由授权：把会被前端直接访问的资源/接口放行
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/index.html", "/favicon.ico",
                                "/assets/**", "/static/**",
                                "/data/**"
                        ).permitAll()

                        // 先放行具体接口，再兜底拦住其余 /api
                        .requestMatchers(HttpMethod.POST, "/api/login").permitAll()
                        .requestMatchers("/api/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/viz3d-out/**","/viz3damp-out/**","/viz-out/**").permitAll()
                        .requestMatchers("/error/**").permitAll()  // 图像文件文件放行
                        .requestMatchers(HttpMethod.POST, "/api/viz/run3d", "/api/run3d/**").permitAll()
                        .requestMatchers("/output/**").permitAll() // 需要登录
                        // 放行静态资源（缩略图、分析结果图）
                        .requestMatchers("/thumbs/**", "/plots/**").permitAll()


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

    // CORS配置：允许本地前端跨域调用后端
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(List.of("http://localhost:3000", "http://localhost:5173"));
        cfg.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS"));
        cfg.setAllowedHeaders(List.of("*"));
        cfg.setAllowCredentials(true);  //允许带cookie/ 授权信息
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }
}
