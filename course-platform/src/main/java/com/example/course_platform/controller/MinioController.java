package com.example.course_platform.controller;

import com.example.course_platform.service.MinioService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.HandlerMapping;

import java.io.InputStream;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/minio")
public class MinioController {

    @Autowired
    private MinioService minioService;

    @GetMapping("/test-public")
    public String testPublic() {
        return "MinIO controller works";
    }

    // Загрузка файла (для тестирования)
    @PostMapping("/upload")
    @PreAuthorize("isAuthenticated()")
    public String uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            String folder = "uploads";
            String fileName = folder + "/" + UUID.randomUUID() + "_" + file.getOriginalFilename();
            minioService.uploadFile(file.getInputStream(), fileName, file.getContentType(), file.getSize());
            return "✅ Файл загружен: " + fileName;
        } catch (Exception e) {
            return "❌ Ошибка: " + e.getMessage();
        }
    }

    @GetMapping("/check-bucket")
    public String checkBucket() {
        try {
            boolean exists = minioService.bucketExists();
            return "Bucket exists: " + exists;
        } catch (Exception e) {
            return "Error: " + e.getMessage();
        }
    }

    // Скачивание файла
    @GetMapping("/download/**")
    public ResponseEntity<?> downloadFile(HttpServletRequest request) {
        // Извлекаем путь из request
        String fullPath = (String) request.getAttribute(
                HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE
        );

        String fileName = fullPath.substring("/minio/download/".length());

        System.out.println("=== Downloading file: " + fileName);

        try {
            // Проверяем существование файла
            if (!minioService.fileExists(fileName)) {
                System.out.println("❌ File not found: " + fileName);
                return ResponseEntity.notFound().build();  // Возвращаем 404 если файл не найден
            }

            System.out.println("✅ File exists, downloading...");
            InputStream inputStream = minioService.downloadFile(fileName);

            // Извлекаем имя файла из пути
            String originalFileName = fileName.substring(fileName.lastIndexOf("/") + 1);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + originalFileName + "\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(new InputStreamResource(inputStream));
        } catch (Exception e) {
            System.out.println("Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Ошибка скачивания файла: " + e.getMessage());
        }
    }

    @GetMapping("/view/**")
    public ResponseEntity<InputStreamResource> viewFile(HttpServletRequest request) {
        try {
            // Извлекаем путь после /minio/view/
            String fileName = request.getRequestURI().substring("/minio/view/".length());
            System.out.println("Viewing file: " + fileName);

            InputStream inputStream = minioService.downloadFile(fileName);
            String contentType = minioService.getContentType(fileName);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(new InputStreamResource(inputStream));
        } catch (Exception e) {
            System.out.println("Error: " + e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    // Получить ссылку на файл (временная)
    @GetMapping("/url")
    @PreAuthorize("isAuthenticated()")
    public String getFileUrl(@RequestParam String fileName) {
        return minioService.getFileUrl(fileName);
    }
}