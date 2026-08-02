package com.bjtu.raillinebackend.security;


import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import java.security.Key;
import java.util.Date;
import java.util.Map;

public class JwtUtil {
    private final Key key;
    private final long expireMillis;

    public JwtUtil(String secret, long expireMinutes) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
        this.expireMillis = expireMinutes * 60 * 1000;
    }

    public String generate(String username, Map<String,Object> claims) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .setSubject(username)
                .addClaims(claims)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + expireMillis))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public Jws<Claims> parse(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
    }
}
