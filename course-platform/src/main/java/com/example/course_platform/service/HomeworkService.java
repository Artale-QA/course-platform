package com.example.course_platform.service;

import com.example.course_platform.entity.Homework;
import com.example.course_platform.entity.Lesson;
import com.example.course_platform.repository.HomeworkRepository;
import com.example.course_platform.repository.LessonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class HomeworkService {

    @Autowired
    private HomeworkRepository homeworkRepository;

    @Autowired
    private LessonRepository lessonRepository;

    // Создать домашнее задание (учитель)
    public Homework createHomework(Long lessonId, Homework homework) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new RuntimeException("Урок не найден"));
        homework.setLesson(lesson);
        return homeworkRepository.save(homework);
    }

    // Получить все задания урока
    public List<Homework> getHomeworkByLessonId(Long lessonId) {
        return homeworkRepository.findByLessonId(lessonId);
    }

    // Получить задание по id
    public Homework getHomeworkById(Long id) {
        return homeworkRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Задание не найдено"));
    }

    // Обновить задание
    public Homework updateHomework(Long id, Homework homeworkDetails) {
        Homework homework = getHomeworkById(id);
        homework.setTitle(homeworkDetails.getTitle());
        homework.setDescription(homeworkDetails.getDescription());
        return homeworkRepository.save(homework);
    }

    // Удалить задание
    public void deleteHomework(Long id) {
        homeworkRepository.deleteById(id);
    }
}