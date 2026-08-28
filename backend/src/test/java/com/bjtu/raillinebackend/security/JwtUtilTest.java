package com.bjtu.raillinebackend.security;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.security.WeakKeyException;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class JwtUtilTest {

    private static final String SECRET = "test-secret-key-that-is-long-enough-for-hs256";

    @Test
    void generatesAndParsesTokenWithSubjectAndClaims() {
        JwtUtil jwtUtil = new JwtUtil(SECRET, 30);

        String token = jwtUtil.generate("alice", Map.of("role", "ADMIN"));
        var claims = jwtUtil.parse(token).getBody();

        assertEquals("alice", claims.getSubject());
        assertEquals("ADMIN", claims.get("role"));
    }

    @Test
    void rejectsSecretThatIsTooShort() {
        assertThrows(WeakKeyException.class, () -> new JwtUtil("too-short", 30));
    }

    @Test
    void rejectsTokenFromAnotherIssuer() {
        JwtUtil issuerA = new JwtUtil(SECRET, 30);
        JwtUtil issuerB = new JwtUtil("another-secret-key-that-is-long-enough-for-hs256", 30);

        assertThrows(JwtException.class, () -> issuerB.parse(issuerA.generate("alice", Map.of())));
    }
}
