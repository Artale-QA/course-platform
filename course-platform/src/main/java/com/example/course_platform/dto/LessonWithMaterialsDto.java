package com.example.course_platform.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class LessonWithMaterialsDto {
    private Long id;
    private String title;
    private String description;
    private Integer orderIndex;
    private Long courseId;
    private List<MaterialDto> materials;
}