package com.example.course_platform.service;

import com.example.course_platform.dto.LoginRequest;
import com.example.course_platform.dto.LoginResponse;
import com.example.course_platform.dto.RegisterRequest;
import com.example.course_platform.entity.Role;
import com.example.course_platform.entity.User;
import com.example.course_platform.repository.RoleRepository;
import com.example.course_platform.repository.UserRepository;
import com.example.course_platform.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private AuthenticationManager authenticationManager;

    public String register(RegisterRequest request) {
        // Проверка, существует ли пользователь
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return "User already exists!";
        }

        // Получаем роль (по умолчанию STUDENT)
        Role role = roleRepository.findByName(request.getRole() != null ? request.getRole() : "STUDENT")
                .orElseThrow(() -> new RuntimeException("Role not found"));

        // Создаём пользователя
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setRole(role);

        userRepository.save(user);

        return "User registered successfully!";
    }

    public LoginResponse login(LoginRequest request) {
        // Аутентификация
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        // Получаем пользователя
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Генерируем токен
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().getName());

        return new LoginResponse(token, user.getEmail(), user.getFullName(), user.getRole().getName());
    }
}
