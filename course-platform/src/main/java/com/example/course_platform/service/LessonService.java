package com.example.course_platform.service;

import com.example.course_platform.dto.FirstLessonDto;
import com.example.course_platform.dto.LessonPreviewDto;
import com.example.course_platform.entity.Course;
import com.example.course_platform.entity.Lesson;
import com.example.course_platform.entity.Material;
import com.example.course_platform.repository.LessonRepository;
import com.example.course_platform.repository.MaterialRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class LessonService {

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private MaterialRepository materialRepository;

    @Autowired
    private CourseService courseService;

    // Получить все уроки (для админки)
    public List<Lesson> getAllLessons() {
        return lessonRepository.findAll();
    }

    public FirstLessonDto getFirstLesson(Long courseId) {
        List<Lesson> lessons = lessonRepository.findByCourseIdOrderByOrderIndexAsc(courseId);
        if (lessons.isEmpty()) {
            throw new RuntimeException("Уроки не найдены");
        }

        Lesson firstLesson = lessons.get(0);

        return FirstLessonDto.builder()
                .id(firstLesson.getId())
                .title(firstLesson.getTitle())
                .description(firstLesson.getDescription())
                .build();
    }

    // Получить превью урока (только заголовок)
    public LessonPreviewDto getLessonPreview(Long id) {
        Lesson lesson = getLessonById(id);

        return LessonPreviewDto.builder()
                .id(lesson.getId())
                .title(lesson.getTitle())
                .orderIndex(lesson.getOrderIndex())
                .build();
    }

    // Получить все превью уроков курса
    public List<LessonPreviewDto> getLessonsPreviewByCourse(Long courseId) {
        return lessonRepository.findByCourseIdOrderByOrderIndexAsc(courseId)
                .stream()
                .map(lesson -> LessonPreviewDto.builder()
                        .id(lesson.getId())
                        .title(lesson.getTitle())
                        .orderIndex(lesson.getOrderIndex())
                        .build())
                .collect(Collectors.toList());
    }

    public List<Lesson> getLessonsByCourseId(Long courseId) {
        return lessonRepository.findByCourseIdOrderByOrderIndexAsc(courseId);
    }

    public Lesson getLessonById(Long id) {
        return lessonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Урок не найден с id: " + id));
    }

    public Lesson createLesson(Long courseId, Lesson lesson) {
        Course course = courseService.getCourseById(courseId);
        lesson.setCourse(course);
        return lessonRepository.save(lesson);
    }

    public Lesson updateLesson(Long id, Lesson lessonDetails) {
        Lesson lesson = getLessonById(id);
        lesson.setTitle(lessonDetails.getTitle());
        lesson.setDescription(lessonDetails.getDescription());
        lesson.setOrderIndex(lessonDetails.getOrderIndex());
        return lessonRepository.save(lesson);
    }

    public void deleteLesson(Long id) {
        lessonRepository.deleteById(id);
    }
}