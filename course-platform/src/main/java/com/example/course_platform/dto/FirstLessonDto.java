package com.example.course_platform.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FirstLessonDto {
    private Long id;
    private String title;
    private String description;      // полное описание первого урока
    private String videoUrl;         // видео первого урока
}