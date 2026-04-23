package com.example.course_platform.util;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", "testSecretKeyForJWTTestingAtLeast32CharsLong");
        ReflectionTestUtils.setField(jwtUtil, "expiration", 86400000L);
    }

    @Test
    void generateToken_ShouldCreateValidToken() {
        String token = jwtUtil.generateToken("test@test.com", "STUDENT");

        assertNotNull(token);
        assertTrue(token.split("\\.").length == 3);
    }

    @Test
    void extractEmail_ShouldReturnCorrectEmail() {
        String token = jwtUtil.generateToken("test@test.com", "STUDENT");

        String email = jwtUtil.extractEmail(token);

        assertEquals("test@test.com", email);
    }

    @Test
    void extractRole_ShouldReturnCorrectRole() {
        String token = jwtUtil.generateToken("test@test.com", "STUDENT");

        String role = jwtUtil.extractRole(token);

        assertEquals("STUDENT", role);
    }

    @Test
    void validateToken_WithValidToken_ShouldReturnTrue() {
        String token = jwtUtil.generateToken("test@test.com", "STUDENT");
        org.springframework.security.core.userdetails.User userDetails =
                new org.springframework.security.core.userdetails.User("test@test.com", "", java.util.Collections.emptyList());

        boolean isValid = jwtUtil.validateToken(token, userDetails);

        assertTrue(isValid);
    }
}