package com.bjtu.raillinebackend.security;

import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class JwtUtilTest {

    private static final String SECRET = "test-secret-key-that-is-long-enough-for-hs256";

    @Test
    void generatesAndParsesTokenWithSubjectAndClaims() {
        JwtUtil jwtUtil = new JwtUtil(SECRET, 30, "rail-line-test");

        String token = jwtUtil.generate("alice", Map.of("role", "ADMIN"));
        var claims = jwtUtil.parse(token).getBody();

        assertEquals("alice", claims.getSubject());
        assertEquals("ADMIN", claims.get("role"));
        assertEquals("rail-line-test", claims.getIssuer());
    }

    @Test
    void rejectsSecretThatIsTooShort() {
        assertThrows(IllegalStateException.class, () -> new JwtUtil("too-short", 30, "rail-line-test"));
    }

    @Test
    void rejectsTokenFromAnotherIssuer() {
        JwtUtil issuerA = new JwtUtil(SECRET, 30, "issuer-a");
        JwtUtil issuerB = new JwtUtil(SECRET, 30, "issuer-b");

        assertThrows(JwtException.class, () -> issuerB.parse(issuerA.generate("alice", Map.of())));
    }
}
