package com.example.course_platform.controller;

import com.example.course_platform.dto.SimulatePaymentRequest;
import com.example.course_platform.entity.*;
import com.example.course_platform.repository.*;
import com.example.course_platform.service.TariffService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/payment")
public class PaymentController {

    @Autowired
    private TariffService tariffService;

    @Autowired
    private TariffRepository tariffRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private UserTariffRepository userTariffRepository;

    // Симуляция оплаты (для pet-проекта)
    @PostMapping("/simulate")
    @PreAuthorize("hasRole('STUDENT')")
    public Map<String, Object> simulatePayment(@RequestBody SimulatePaymentRequest request, Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        Tariff tariff = tariffRepository.findById(request.getTariffId())
                .orElseThrow(() -> new RuntimeException("Тариф не найден"));

        // Добавляем запись в user_tariffs (без курса)
        UserTariff userTariff = new UserTariff();
        userTariff.setUser(user);
        userTariff.setTariff(tariff);
        userTariff.setIsActive(true);
        userTariff.setCreatedAt(LocalDateTime.now());
        userTariffRepository.save(userTariff);

        // ✅ Добавляем запись в enrollments (запись на курс)
        Course course = tariff.getCourse();
        if (course != null) {
            Optional<Enrollment> existingEnrollment = enrollmentRepository.findByUserIdAndCourseId(user.getId(), course.getId());
            if (existingEnrollment.isEmpty()) {
                Enrollment enrollment = new Enrollment();
                enrollment.setUser(user);
                enrollment.setCourse(course);
                enrollment.setEnrolledAt(LocalDateTime.now());
                enrollmentRepository.save(enrollment);
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Тариф «" + tariff.getTitle() + "» успешно активирован!");

        return response;
    }
}