package com.example.course_platform.service;

import com.example.course_platform.dto.CoursePreviewDto;
import com.example.course_platform.entity.Course;
import com.example.course_platform.entity.User;
import com.example.course_platform.repository.CourseRepository;
import com.example.course_platform.repository.EnrollmentRepository;
import com.example.course_platform.repository.LessonRepository;
import com.example.course_platform.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CourseService {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    // Получить превью всех курсов
    public List<CoursePreviewDto> getCoursesPreview() {
        return courseRepository.findAll()
                .stream()
                .map(course -> CoursePreviewDto.builder()
                        .id(course.getId())
                        .title(course.getTitle())
                        .shortDescription(course.getDescription().length() > 100
                                ? course.getDescription().substring(0, 100) + "..."
                                : course.getDescription())
                        .lessonsCount(lessonRepository.countByCourseId(course.getId()))
                        .build())
                .collect(Collectors.toList());
    }

    // Получить превью одного курса
    public CoursePreviewDto getCoursePreview(Long id) {
        Course course = getCourseById(id);

        return CoursePreviewDto.builder()
                .id(course.getId())
                .title(course.getTitle())
                .shortDescription(course.getDescription())
                .lessonsCount(lessonRepository.countByCourseId(id))
                .build();
    }

    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    public Course getCourseById(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Курс не найден с id: " + id));
    }

    public Course createCourse(Course course) {
        return courseRepository.save(course);
    }

    public Course updateCourse(Long id, Course courseDetails) {
        Course course = getCourseById(id);
        course.setTitle(courseDetails.getTitle());
        course.setDescription(courseDetails.getDescription());
        return courseRepository.save(course);
    }

    public void deleteCourse(Long id) {
        courseRepository.deleteById(id);
    }

    /**
     * Проверяет, имеет ли пользователь доступ к курсу
     * @param courseId ID курса
     * @param email Email пользователя
     * @return true если доступ есть, false если нет
     */
    public boolean hasAccessToCourse(Long courseId, String email) {
        // Проверяем, существует ли пользователь
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден: " + email));

        String role = user.getRole().getName();

        // ADMIN имеет доступ ко всем курсам
        if ("ADMIN".equals(role)) {
            return true;
        }

        // TEACHER имеет доступ ко всем курсам
        if ("TEACHER".equals(role)) {
            return true;
        }

        // MODERATOR имеет доступ ко всем курсам (на просмотр)
        if ("MODERATOR".equals(role)) {
            return true;
        }

        // STUDENT — только если записан на курс
        if ("STUDENT".equals(role)) {
            return enrollmentRepository.findByUserIdAndCourseId(user.getId(), courseId).isPresent();
        }

        // GUEST или неизвестная роль — доступа нет
        return false;
    }
}