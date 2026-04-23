package com.example.course_platform.dto;

import lombok.Data;

@Data
public class MaterialRequestDto {
    private String description;
    private Boolean isMainVideo = false;
    private Integer orderIndex = 0;
}