package com.example.course_platform.dto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class SubmissionDto {
    private String comment;
    private MultipartFile file;
}
