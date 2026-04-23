package com.example.course_platform.integration;

import com.example.course_platform.dto.LoginRequest;
import com.example.course_platform.dto.RegisterRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    // Убери @Autowired для ObjectMapper, используй новый экземпляр
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void registerAndLogin_ShouldWork() throws Exception {
        // Регистрация
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail("int_test@test.com");
        registerRequest.setPassword("123");
        registerRequest.setFullName("Integration Test");
        registerRequest.setRole("STUDENT");

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk());

        // Логин
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("int_test@test.com");
        loginRequest.setPassword("123");

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.role").value("STUDENT"));
    }
}