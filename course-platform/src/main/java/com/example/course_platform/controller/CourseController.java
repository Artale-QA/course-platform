package com.example.course_platform.controller;

import com.example.course_platform.dto.CoursePreviewDto;
import com.example.course_platform.dto.TariffDto;
import com.example.course_platform.entity.Course;
import com.example.course_platform.entity.Lesson;
import com.example.course_platform.entity.Tariff;
import com.example.course_platform.entity.User;
import com.example.course_platform.repository.TariffRepository;
import com.example.course_platform.repository.UserRepository;
import com.example.course_platform.service.CoursePreviewService;
import com.example.course_platform.service.CourseService;
import com.example.course_platform.service.LessonService;
import com.example.course_platform.service.TariffService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/courses")
public class CourseController {

    @Autowired
    private CourseService courseService;

    @Autowired
    private LessonService lessonService;

    @Autowired
    private TariffService tariffService;

    @Autowired
    private CoursePreviewService coursePreviewService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TariffRepository tariffRepository;

    // Получить полную информацию о курсе (для страницы курса)
    @GetMapping("/{id}/full")
    @Transactional
    public ResponseEntity<?> getCourseFullPage(@PathVariable Long id, Authentication authentication) {
        Course course = courseService.getCourseById(id);
        Map<String, Object> preview = coursePreviewService.getCoursePreview(id);
        List<Tariff> tariffs = tariffService.getAllTariffs();

        User user = null;
        if (authentication != null) {
            String email = authentication.getName();
            user = userRepository.findByEmail(email).orElse(null);
        }

        // ✅ Создаём финальную копию для использования в лямбде
        final User finalUser = user;

        List<Lesson> allLessons = lessonService.getLessonsByCourseId(id);
        List<Lesson> availableLessons = allLessons.stream()
                .filter(lesson -> tariffService.hasAccessToLesson(finalUser, lesson))
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("course", course);
        response.put("preview", preview);
        response.put("tariffs", tariffs);
        response.put("lessons", availableLessons);
        response.put("totalLessons", allLessons.size());
        response.put("hasAccess", user != null && tariffService.hasAccessToCourse(user, id));
        response.put("userTariff", user != null ? tariffService.getUserActiveTariff(user) : null);

        return ResponseEntity.ok(response);
    }

    // Все авторизованные могут смотреть курсы
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<Course> getAllCourses() {
        return courseService.getAllCourses();
    }

    // Превью курсов для гостей (только заголовки)
    @GetMapping("/preview")
    public List<CoursePreviewDto> getCoursesPreview() {
        return courseService.getCoursesPreview();
    }

    @GetMapping("/{id}/tariffs")
    public List<TariffDto> getTariffsByCourse(@PathVariable Long id) {
        return tariffRepository.findByCourseId(id).stream()
                .map(tariff -> TariffDto.builder()
                        .id(tariff.getId())
                        .name(tariff.getName())
                        .title(tariff.getTitle())
                        .description(tariff.getDescription())
                        .price(tariff.getPrice())
                        .build())
                .collect(Collectors.toList());
    }

    // Краткая информация о курсе для гостей
    @GetMapping("/{id}/preview")
    public CoursePreviewDto getCoursePreview(@PathVariable Long id) {
        return courseService.getCoursePreview(id);
    }

    // Все авторизованные могут смотреть один курс
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public Course getCourseById(@PathVariable Long id) {
        return courseService.getCourseById(id);
    }

    // TEACHER и ADMIN могут создавать курсы
    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public Course createCourse(@RequestBody Course course) {
        return courseService.createCourse(course);
    }

    // TEACHER и ADMIN могут обновлять курсы
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public Course updateCourse(@PathVariable Long id, @RequestBody Course course) {
        return courseService.updateCourse(id, course);
    }

    // Только ADMIN может удалять курсы
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteCourse(@PathVariable Long id) {
        courseService.deleteCourse(id);
    }
}