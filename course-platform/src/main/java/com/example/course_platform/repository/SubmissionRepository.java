package com.example.course_platform.repository;

import com.example.course_platform.entity.Lesson;
import com.example.course_platform.entity.Submission;
import com.example.course_platform.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByLessonId(Long lessonId);

    List<Submission> findByStudentId(Long studentId);

    List<Submission> findByStatus(String status);

    List<Submission> findByLessonIdAndStatus(Long lessonId, String status);

    List<Submission> findByLessonIdAndStudentIdOrderBySubmittedAtDesc(Long lessonId, Long studentId);

    // Поиск по уроку и студенту (через объекты)
    Optional<Submission> findByLessonAndStudent(Lesson lesson, User student);

    Optional<Submission> findByLessonIdAndStudentId(Long lessonId, Long studentId);

    // Получить последнюю работу по уроку и студенту
    @Query("SELECT s FROM Submission s WHERE s.lesson = :lesson AND s.student = :student ORDER BY s.submittedAt DESC")
    List<Submission> findAllByLessonAndStudentOrderBySubmittedAtDesc(@Param("lesson") Lesson lesson, @Param("student") User student);

    // Получить все работы студента по уроку (история)
    List<Submission> findByLessonAndStudentOrderBySubmittedAtDesc(Lesson lesson, User student);
}