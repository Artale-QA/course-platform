package com.example.course_platform.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "tariff_lessons")
public class TariffLesson {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tariff_id")
    private Long tariffId;

    @Column(name = "lesson_id")
    private Long lessonId;
}