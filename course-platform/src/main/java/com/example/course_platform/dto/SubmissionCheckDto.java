package com.example.course_platform.dto;

import lombok.Data;

@Data
public class SubmissionCheckDto {
    private String teacherComment;
    private String status;  // PENDING, CHECKED
}