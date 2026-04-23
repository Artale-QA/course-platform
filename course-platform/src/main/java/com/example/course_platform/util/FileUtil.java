package com.example.course_platform.util;

import org.springframework.web.multipart.MultipartFile;

public class FileUtil {

    // Проверка на пустой файл
    public static boolean isEmpty(MultipartFile file) {
        return file == null || file.isEmpty();
    }

    // Получить расширение файла
    public static String getFileExtension(String fileName) {
        if (fileName == null || fileName.lastIndexOf(".") == -1) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
    }

    // Проверить допустимое расширение
    public static boolean isAllowedExtension(String fileName, String[] allowedExtensions) {
        String ext = getFileExtension(fileName);
        for (String allowed : allowedExtensions) {
            if (allowed.equalsIgnoreCase(ext)) {
                return true;
            }
        }
        return false;
    }
}