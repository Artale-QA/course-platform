package com.example.course_platform.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.Map;

@RestController
public class TestController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/test-db")
    public String testDb() {
        try {
            List<Map<String, Object>> result = jdbcTemplate.queryForList("SELECT 1 as connected");
            return "✅ Подключение к PostgreSQL успешно!";
        } catch (Exception e) {
            return "❌ Ошибка подключения: " + e.getMessage();
        }
    }
}