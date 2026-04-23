package com.example.course_platform.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "submissions")
public class Submission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "file_path", nullable = false)
    private String filePath;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(nullable = false)
    private String status = "PENDING";  // PENDING, CHECKED, REJECTED

    @Column(name = "teacher_comment", columnDefinition = "TEXT")
    private String teacherComment;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt = LocalDateTime.now();

    @Column(name = "checked_at")
    private LocalDateTime checkedAt;

    @ManyToOne
    @JoinColumn(name = "lesson_id", nullable = false)
    private Lesson lesson;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Transient  // ← не сохраняется в БД
    public String getFileType() {
        String filePath = getFilePath();
        if (filePath == null) return "application/octet-stream";

        String lowerPath = filePath.toLowerCase();
        if (lowerPath.endsWith(".mp4")) return "video/mp4";
        if (lowerPath.endsWith(".pdf")) return "application/pdf";
        if (lowerPath.endsWith(".jpg") || lowerPath.endsWith(".jpeg")) return "image/jpeg";
        if (lowerPath.endsWith(".png")) return "image/png";
        if (lowerPath.endsWith(".mp3")) return "audio/mpeg";

        return "application/octet-stream";
    }
}