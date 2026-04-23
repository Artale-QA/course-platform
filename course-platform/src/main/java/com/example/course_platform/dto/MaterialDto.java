package com.example.course_platform.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class MaterialDto {
    private Long id;
    private String fileName;
    private String filePath;
    private LocalDateTime uploadedAt;
}