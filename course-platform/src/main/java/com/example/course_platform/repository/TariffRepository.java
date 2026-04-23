package com.example.course_platform.repository;

import com.example.course_platform.entity.Tariff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TariffRepository extends JpaRepository<Tariff, Long> {
    List<Tariff> findByIsActiveTrueOrderBySortOrderAsc();
    Optional<Tariff> findByName(String name);
    @Query("SELECT CASE WHEN COUNT(l) > 0 THEN true ELSE false END " +
            "FROM Tariff t JOIN t.lessons l " +
            "WHERE t.id = :tariffId AND l.course.id = :courseId")
    boolean hasLessonInCourse(@Param("tariffId") Long tariffId, @Param("courseId") Long courseId);
    @Query("SELECT CASE WHEN COUNT(l) > 0 THEN true ELSE false END " +
            "FROM Tariff t JOIN t.lessons l " +
            "WHERE t.id = :tariffId AND l.id = :lessonId")
    boolean isLessonInTariff(@Param("tariffId") Long tariffId, @Param("lessonId") Long lessonId);
    @Query("SELECT DISTINCT t FROM Tariff t LEFT JOIN FETCH t.lessons")
    List<Tariff> findAllWithLessons();
    List<Tariff> findByCourseIdAndIsActiveTrueOrderBySortOrderAsc(Long courseId);

    List<Tariff> findByCourseId(Long courseId);



}
