package com.example.course_platform.controller;

import com.example.course_platform.entity.Course;
import com.example.course_platform.entity.User;
import com.example.course_platform.repository.EnrollmentRepository;
import com.example.course_platform.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @GetMapping("/my-courses")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    public List<Course> getMyCourses(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
        return enrollmentRepository.findCoursesByUserId(user.getId());
    }
}