package com.example.course_platform.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CoursePreviewDto {
    private Long id;
    private String title;
    private String shortDescription;  // только краткое описание
    private Integer lessonsCount;
}