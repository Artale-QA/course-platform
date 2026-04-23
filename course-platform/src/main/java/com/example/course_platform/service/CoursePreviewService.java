package com.example.course_platform.service;

import com.example.course_platform.entity.Course;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class CoursePreviewService {

    @Autowired
    private MinioService minioService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // Получить превью курса
    public Map<String, Object> getCoursePreview(Long courseId) {
        Map<String, Object> preview = new HashMap<>();

        // Пытаемся загрузить preview.json из MinIO
        String jsonPath = "course-preview/" + courseId + "/preview.json";
        String jsonContent = minioService.getJsonContent(jsonPath);

        if (jsonContent != null) {
            try {
                JsonNode node = objectMapper.readTree(jsonContent);
                preview.put("title", node.has("title") ? node.get("title").asText() : null);
                preview.put("subtitle", node.has("subtitle") ? node.get("subtitle").asText() : null);
                preview.put("description", node.has("description") ? node.get("description").asText() : null);
                preview.put("features", node.has("features") ? node.get("features") : null);
                preview.put("tariffDescription", node.has("tariffDescription") ? node.get("tariffDescription").asText() : null);

                // Проверяем наличие медиа
                String heroImagePath = "course-preview/" + courseId + "/hero.jpg";
                String heroVideoPath = "course-preview/" + courseId + "/hero.mp4";

                preview.put("heroImageUrl", minioService.fileExists(heroImagePath) ?
                        minioService.getFileUrl(heroImagePath) : null);
                preview.put("heroVideoUrl", minioService.fileExists(heroVideoPath) ?
                        minioService.getFileUrl(heroVideoPath) : null);

                // Кастомный HTML
                String htmlPath = "course-preview/" + courseId + "/content.html";
                preview.put("htmlContent", minioService.fileExists(htmlPath) ?
                        minioService.getJsonContent(htmlPath) : null);

            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        // Если нет кастомного превью — возвращаем дефолтное
        if (preview.isEmpty()) {
            return getDefaultPreview(courseId);
        }

        return preview;
    }

    // Дефолтное превью (если нет в MinIO)
    private Map<String, Object> getDefaultPreview(Long courseId) {
        Map<String, Object> preview = new HashMap<>();
        preview.put("title", "Акустическая гитара для начинающих");
        preview.put("subtitle", "Научись играть с нуля до первых песен");
        preview.put("description", "Интерактивные уроки, понятная теория и практика. Играй то, что нравится, уже через 2 недели!");
        preview.put("tariffDescription", "Выберите подходящий тариф и начните обучение");

        // Дефолтные преимущества
        preview.put("features", getDefaultFeatures());

        return preview;
    }

    private String getDefaultFeatures() {
        return "[{\"icon\":\"📚\",\"title\":\"Структурированные курсы\",\"description\":\"От простого к сложному. Каждый урок — новый навык.\"}," +
                "{\"icon\":\"🎯\",\"title\":\"Практические задания\",\"description\":\"Закрепляй теорию на практике с домашними заданиями.\"}," +
                "{\"icon\":\"👨‍🏫\",\"title\":\"Обратная связь\",\"description\":\"Преподаватели проверяют работы и дают советы.\"}," +
                "{\"icon\":\"📱\",\"title\":\"Учись где угодно\",\"description\":\"Доступ с компьютера, планшета или телефона.\"}]";
    }
}