package com.example.course_platform.repository;

import com.example.course_platform.entity.TariffLesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TariffLessonRepository extends JpaRepository<TariffLesson, Long> {
    List<TariffLesson> findByLessonId(Long lessonId);
    void deleteByLessonId(Long lessonId);
    boolean existsByLessonId(Long lessonId);
}
