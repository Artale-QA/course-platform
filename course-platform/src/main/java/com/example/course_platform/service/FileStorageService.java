package com.example.course_platform.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;



@Service
public class FileStorageService {

    @Autowired
    private MinioService minioService;

    public String saveFile(MultipartFile file, Long lessonId) {
        String folder = "lesson_" + lessonId;
        return minioService.uploadFile(file, folder);
    }

    public String getFileUrl(String filePath) {
        return minioService.getFileUrl(filePath);
    }

    public void deleteFile(String filePath) {
        minioService.deleteFile(filePath);
    }
}