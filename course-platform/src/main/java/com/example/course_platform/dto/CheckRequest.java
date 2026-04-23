package com.example.course_platform.dto;

import lombok.Data;

@Data
public class CheckRequest {
    private String status;  // APPROVED или REJECTED
    private String teacherComment;
}