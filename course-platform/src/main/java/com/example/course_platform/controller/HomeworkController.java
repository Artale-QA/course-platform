package com.example.course_platform.controller;

import com.example.course_platform.dto.HomeworkDto;
import com.example.course_platform.entity.Homework;
import com.example.course_platform.service.HomeworkService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/lessons/{lessonId}/homework")
public class HomeworkController {

    @Autowired
    private HomeworkService homeworkService;

    // Создать задание (ADMIN)
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN')")
    public Homework createHomework(@PathVariable Long lessonId, @RequestBody HomeworkDto homeworkDto) {
        Homework homework = new Homework();
        homework.setTitle(homeworkDto.getTitle());
        homework.setDescription(homeworkDto.getDescription());
        return homeworkService.createHomework(lessonId, homework);
    }

    // Получить все задания урока (все авторизованные)
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<Homework> getHomeworkByLessonId(@PathVariable Long lessonId) {
        return homeworkService.getHomeworkByLessonId(lessonId);
    }

    // Обновить задание (ADMIN)
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public Homework updateHomework(@PathVariable Long id, @RequestBody HomeworkDto homeworkDto) {
        Homework homework = new Homework();
        homework.setTitle(homeworkDto.getTitle());
        homework.setDescription(homeworkDto.getDescription());
        return homeworkService.updateHomework(id, homework);
    }

    // Удалить задание (ADMIN)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteHomework(@PathVariable Long id) {
        homeworkService.deleteHomework(id);
    }
}