package com.example.course_platform.dto;

import lombok.Data;
import lombok.Builder;

@Data
@Builder
public class MaterialResponseDto {
    private Long id;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private String description;
    private Boolean isMainVideo;
    private Integer orderIndex;
    private String downloadUrl;
    private Long lessonId;
}