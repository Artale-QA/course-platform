package com.example.course_platform.repository;

import com.example.course_platform.entity.Material;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface MaterialRepository extends JpaRepository<Material, Long> {
    List<Material> findByLessonIdOrderByUploadedAtAsc(Long lessonId);
    void deleteByLessonId(Long lessonId);
}
