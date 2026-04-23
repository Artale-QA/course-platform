package com.example.course_platform.repository;

import com.example.course_platform.entity.Course;
import com.example.course_platform.entity.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    List<Enrollment> findByUserId(Long userId);
    List<Enrollment> findByCourseId(Long courseId);
    Optional<Enrollment> findByUserIdAndCourseId(Long userId, Long courseId);

    @Query("SELECT e.course FROM Enrollment e WHERE e.user.id = :userId")
    List<Course> findCoursesByUserId(@Param("userId") Long userId);
}
