package com.example.course_platform.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class SubmissionResponseDto {
    private Long id;
    private String studentName;
    private String studentEmail;
    private String filePath;
    private String fileType;
    private String comment;
    private String status;
    private String teacherComment;
    private LocalDateTime submittedAt;
    private LocalDateTime checkedAt;
}