package com.example.course_platform.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class TariffDto {
    private Long id;
    private String name;
    private String title;
    private String description;
    private BigDecimal price;
}