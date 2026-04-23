package com.example.course_platform.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LessonPreviewDto {
    private Long id;
    private String title;
    private Integer orderIndex;
}
