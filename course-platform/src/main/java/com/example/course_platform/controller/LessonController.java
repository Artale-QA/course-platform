package com.example.course_platform.controller;

import com.example.course_platform.entity.Lesson;
import com.example.course_platform.entity.User;
import com.example.course_platform.repository.UserRepository;
import com.example.course_platform.service.LessonService;
import com.example.course_platform.service.TariffService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/courses/{courseId}/lessons")
public class LessonController {

    @Autowired
    private LessonService lessonService;

    @Autowired
    private TariffService tariffService;

    @Autowired
    private UserRepository userRepository;

    // Получить все доступные уроки курса (с учётом тарифа)
    @GetMapping
    public ResponseEntity<?> getLessonsByCourseId(@PathVariable Long courseId, Authentication authentication) {
        List<Lesson> allLessons = lessonService.getLessonsByCourseId(courseId);

        User user;
        if (authentication != null) {
            String email = authentication.getName();
            user = userRepository.findByEmail(email).orElse(null);
        } else {
            user = null;
        }

        List<Lesson> availableLessons = allLessons.stream()
                .filter(lesson -> tariffService.hasAccessToLesson(user, lesson))
                .collect(Collectors.toList());

        // Для неавторизованных и студентов с ограниченным доступом
        if (user == null || "STUDENT".equals(user.getRole().getName())) {
            return ResponseEntity.ok(availableLessons);
        }

        // Для админов и учителей — все уроки
        return ResponseEntity.ok(allLessons);
    }

    // Получить конкретный урок с проверкой доступа
    @GetMapping("/{id}")
    public ResponseEntity<?> getLessonById(
            @PathVariable Long courseId,
            @PathVariable Long id,
            Authentication authentication) {

        System.out.println("=== Course ID: " + courseId);
        System.out.println("=== Lesson ID: " + id);

        Lesson lesson = lessonService.getLessonById(id);

        // Проверяем, что урок принадлежит курсу
        if (!lesson.getCourse().getId().equals(courseId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Урок не принадлежит этому курсу"));
        }

        User user = null;
        if (authentication != null) {
            String email = authentication.getName();
            user = userRepository.findByEmail(email).orElse(null);
        }

        if (!tariffService.hasAccessToLesson(user, lesson)) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Доступ запрещён");
            error.put("message", "У вас нет доступа к этому уроку. Приобретите соответствующий тариф.");
            error.put("lessonId", id);
            error.put("lessonTitle", lesson.getTitle());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        }

        return ResponseEntity.ok(lesson);
    }

    // TEACHER и ADMIN могут создавать уроки (без проверки тарифов)
    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public Lesson createLesson(@PathVariable Long courseId, @RequestBody Lesson lesson) {
        return lessonService.createLesson(courseId, lesson);
    }

    // TEACHER и ADMIN могут обновлять уроки
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public Lesson updateLesson(@PathVariable Long id, @RequestBody Lesson lesson) {
        return lessonService.updateLesson(id, lesson);
    }

    // Только ADMIN может удалять уроки
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteLesson(@PathVariable Long id) {
        lessonService.deleteLesson(id);
    }
}