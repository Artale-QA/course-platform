package com.example.course_platform.controller;

import com.example.course_platform.dto.RegisterRequest;
import com.example.course_platform.dto.RoleUpdateRequest;
import com.example.course_platform.dto.TariffDto;
import com.example.course_platform.dto.UserResponseDto;
import com.example.course_platform.entity.*;
import com.example.course_platform.repository.*;
import com.example.course_platform.service.MinioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import lombok.Data;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
public class AdminController {

    @Autowired
    private MinioService minioService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private TariffRepository tariffRepository;

    @Autowired
    private MaterialRepository materialRepository;


    @Autowired
    private TariffLessonRepository tariffLessonRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // ========== УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ==========

    @GetMapping("/users")
    public List<UserResponseDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @GetMapping("/users/{id}")
    public UserResponseDto getUserById(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
        return convertToDto(user);
    }

    @PostMapping("/users")
    public UserResponseDto createUser(@RequestBody RegisterRequest request, Authentication auth) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Пользователь с таким email уже существует");
        }

        String currentUserEmail = auth.getName();
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
        String currentRole = currentUser.getRole().getName();

        boolean isModerator = "MODERATOR".equals(currentRole);

        if (isModerator && ("ADMIN".equals(request.getRole()) || "MODERATOR".equals(request.getRole()))) {
            throw new RuntimeException("Модератор не может создавать администраторов или других модераторов");
        }

        Role role = roleRepository.findByName(request.getRole())
                .orElseThrow(() -> new RuntimeException("Роль не найдена: " + request.getRole()));

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setRole(role);

        User saved = userRepository.save(user);
        return convertToDto(saved);
    }

    // ========== ПОЛУЧЕНИЕ УРОКА ДЛЯ РЕДАКТИРОВАНИЯ ==========

    @GetMapping("/lessons/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Lesson getLessonById(@PathVariable Long id) {
        return lessonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Урок не найден"));
    }

    @DeleteMapping("/users/{id}")
    public void deleteUser(@PathVariable Long id, Authentication auth) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        String currentUserEmail = auth.getName();
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
        String currentRole = currentUser.getRole().getName();

        boolean isModerator = "MODERATOR".equals(currentRole);
        String roleName = user.getRole().getName();

        if (isModerator && ("ADMIN".equals(roleName) || "MODERATOR".equals(roleName))) {
            throw new RuntimeException("Модератор не может удалять администраторов или других модераторов");
        }

        if (currentUser.getId().equals(id)) {
            throw new RuntimeException("Нельзя удалить самого себя");
        }

        userRepository.deleteById(id);
    }

    @PutMapping("/users/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponseDto updateUserRole(@PathVariable Long id, @RequestBody RoleUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        Role role = roleRepository.findByName(request.getRoleName())
                .orElseThrow(() -> new RuntimeException("Роль не найдена: " + request.getRoleName()));

        user.setRole(role);
        User saved = userRepository.save(user);
        return convertToDto(saved);
    }

    private UserResponseDto convertToDto(User user) {
        return UserResponseDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().getName())
                .build();
    }

    // ========== УПРАВЛЕНИЕ КУРСАМИ ==========

    @GetMapping("/courses")
    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    @PostMapping("/courses")
    public Course createCourse(@RequestBody Course course) {
        return courseRepository.save(course);
    }

    @PutMapping("/courses/{id}")
    public Course updateCourse(@PathVariable Long id, @RequestBody Course course) {
        Course existing = courseRepository.findById(id).orElseThrow();
        existing.setTitle(course.getTitle());
        existing.setDescription(course.getDescription());
        return courseRepository.save(existing);
    }

    @DeleteMapping("/courses/{id}")
    public void deleteCourse(@PathVariable Long id) {
        courseRepository.deleteById(id);
    }

    // ========== УПРАВЛЕНИЕ УРОКАМИ ==========

    @GetMapping("/courses/{courseId}/lessons")
    public List<Lesson> getLessonsByCourse(@PathVariable Long courseId) {
        return lessonRepository.findByCourseIdOrderByOrderIndexAsc(courseId);
    }

    @PostMapping("/courses/{courseId}/lessons")
    public Lesson createLesson(@PathVariable Long courseId, @RequestBody Lesson lesson) {
        Course course = courseRepository.findById(courseId).orElseThrow();
        lesson.setCourse(course);
        return lessonRepository.save(lesson);
    }

    @PutMapping("/lessons/{id}")
    public Lesson updateLesson(@PathVariable Long id, @RequestBody Lesson lesson) {
        Lesson existing = lessonRepository.findById(id).orElseThrow();
        existing.setTitle(lesson.getTitle());
        existing.setDescription(lesson.getDescription());
        existing.setOrderIndex(lesson.getOrderIndex());
        existing.setVideoUrl(lesson.getVideoUrl());
        return lessonRepository.save(existing);
    }

    @DeleteMapping("/lessons/{id}")
    public void deleteLesson(@PathVariable Long id) {
        lessonRepository.deleteById(id);
    }

    // ========== УПРАВЛЕНИЕ МАТЕРИАЛАМИ ==========

    @PostMapping("/lessons/{lessonId}/materials")
    @PreAuthorize("hasRole('ADMIN')")
    public Material addMaterial(
            @PathVariable Long lessonId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "description", required = false) String description) {

        try {
            Lesson lesson = lessonRepository.findById(lessonId)
                    .orElseThrow(() -> new RuntimeException("Урок не найден"));

            // Сохраняем файл в MinIO
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            String fileName = "lesson_" + lessonId + "/" + System.currentTimeMillis() + "_" + originalFilename;

            minioService.uploadFile(file.getInputStream(), fileName, file.getContentType(), file.getSize());

            // Создаём запись в БД
            Material material = new Material();
            material.setLesson(lesson);
            material.setFileName(originalFilename);
            material.setFilePath(fileName);

            return materialRepository.save(material);
        } catch (Exception e) {
            throw new RuntimeException("Ошибка загрузки файла: " + e.getMessage());
        }
    }

    @GetMapping("/lessons/{lessonId}/materials")
    @PreAuthorize("hasRole('ADMIN')")
    public List<Material> getMaterials(@PathVariable Long lessonId) {
        return materialRepository.findByLessonIdOrderByUploadedAtAsc(lessonId);
    }

    @DeleteMapping("/materials/{materialId}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteMaterial(@PathVariable Long materialId) {
        Material material = materialRepository.findById(materialId)
                .orElseThrow(() -> new RuntimeException("Материал не найден"));

        // Удаляем файл из MinIO
        minioService.deleteFile(material.getFilePath());

        // Удаляем запись из БД
        materialRepository.deleteById(materialId);
    }

    // ========== НАЗНАЧЕНИЕ ТАРИФОВ УРОКАМ (через tariff_lessons) ==========

    @PostMapping("/lessons/{lessonId}/tariffs")
    @Transactional
    public void assignTariffsToLesson(@PathVariable Long lessonId, @RequestBody List<Long> tariffIds) {
        // Удаляем старые связи
        tariffLessonRepository.deleteByLessonId(lessonId);

        // Добавляем новые связи
        for (Long tariffId : tariffIds) {
            TariffLesson tariffLesson = new TariffLesson();
            tariffLesson.setLessonId(lessonId);
            tariffLesson.setTariffId(tariffId);
            tariffLessonRepository.save(tariffLesson);
        }
    }

    @GetMapping("/lessons/{lessonId}/tariffs")
    public List<TariffDto> getLessonTariffs(@PathVariable Long lessonId) {
        List<TariffLesson> tariffLessons = tariffLessonRepository.findByLessonId(lessonId);
        List<Long> tariffIds = tariffLessons.stream()
                .map(TariffLesson::getTariffId)
                .collect(Collectors.toList());

        if (tariffIds.isEmpty()) {
            return List.of();
        }

        return tariffRepository.findAllById(tariffIds).stream()
                .map(tariff -> TariffDto.builder()
                        .id(tariff.getId())
                        .name(tariff.getName())
                        .title(tariff.getTitle())
                        .description(tariff.getDescription())
                        .price(tariff.getPrice())
                        .build())
                .collect(Collectors.toList());
    }

    @GetMapping("/courses/{courseId}/tariffs")
    @PreAuthorize("hasRole('ADMIN')")
    public List<TariffDto> getTariffsByCourse(@PathVariable Long courseId) {
        return tariffRepository.findByCourseId(courseId).stream()
                .map(tariff -> TariffDto.builder()
                        .id(tariff.getId())
                        .name(tariff.getName())
                        .title(tariff.getTitle())
                        .description(tariff.getDescription())
                        .price(tariff.getPrice())
                        .build())
                .collect(Collectors.toList());
    }

    @PostMapping("/courses/{courseId}/tariffs")
    @PreAuthorize("hasRole('ADMIN')")
    public Tariff createTariff(@PathVariable Long courseId, @RequestBody Tariff tariff) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Курс не найден"));

        Tariff newTariff = new Tariff();
        newTariff.setName(tariff.getName());
        newTariff.setTitle(tariff.getTitle());
        newTariff.setDescription(tariff.getDescription());
        newTariff.setPrice(tariff.getPrice());
        newTariff.setCourse(course);
        newTariff.setSortOrder(0);
        newTariff.setIsActive(true);

        return tariffRepository.save(newTariff);
    }

    // ========== УПРАВЛЕНИЕ ТАРИФАМИ ==========

    @GetMapping("/tariffs")
    public List<Tariff> getAllTariffs() {
        return tariffRepository.findAllWithLessons();
    }

    @PostMapping("/tariffs")
    public TariffDto createTariff(@RequestBody Tariff tariff) {
        Tariff saved = tariffRepository.save(tariff);
        return TariffDto.builder()
                .id(saved.getId())
                .name(saved.getName())
                .title(saved.getTitle())
                .description(saved.getDescription())
                .price(saved.getPrice())
                .build();
    }

    @PutMapping("/tariffs/{id}")
    public TariffDto updateTariff(@PathVariable Long id, @RequestBody Tariff tariff) {
        Tariff existing = tariffRepository.findById(id).orElseThrow();
        existing.setName(tariff.getName());
        existing.setTitle(tariff.getTitle());
        existing.setDescription(tariff.getDescription());
        existing.setPrice(tariff.getPrice());
        Tariff saved = tariffRepository.save(existing);
        return TariffDto.builder()
                .id(saved.getId())
                .name(saved.getName())
                .title(saved.getTitle())
                .description(saved.getDescription())
                .price(saved.getPrice())
                .build();
    }

    @DeleteMapping("/tariffs/{id}")
    public void deleteTariff(@PathVariable Long id) {
        tariffRepository.deleteById(id);
    }

    @PostMapping("/lessons/upload-video")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, String> uploadLessonVideo(
            @RequestParam("file") MultipartFile file,
            @RequestParam("courseId") Long courseId,
            @RequestParam("orderIndex") Integer orderIndex,
            @RequestParam(value = "lessonId", required = false) Long lessonId) {

        try {
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename.substring(originalFilename.lastIndexOf("."));

            // Формируем правильный путь сразу
            String fileName;
            if (lessonId != null) {
                // Если урок уже создан
                fileName = String.format("course_%d/lesson_%d_%d_%s",
                        courseId, orderIndex, lessonId, System.currentTimeMillis() + extension);
            } else {
                // Временный путь (потом обновишь)
                fileName = String.format("course_%d/temp_%d_%s",
                        courseId, System.currentTimeMillis(), extension);
            }

            minioService.uploadFile(file.getInputStream(), fileName, file.getContentType(), file.getSize());

            Map<String, String> response = new HashMap<>();
            response.put("videoUrl", fileName);
            return response;
        } catch (Exception e) {
            throw new RuntimeException("Ошибка загрузки видео: " + e.getMessage());
        }
    }



    // ========== ЗАГРУЗКА ПРЕВЬЮ КУРСА ==========

    @PostMapping("/courses/{courseId}/preview")
    @PreAuthorize("hasRole('ADMIN')")
    public String uploadCoursePreview(
            @PathVariable Long courseId,
            @RequestParam(value = "json", required = false) MultipartFile jsonFile,
            @RequestParam(value = "heroImage", required = false) MultipartFile heroImage,
            @RequestParam(value = "heroVideo", required = false) MultipartFile heroVideo,
            @RequestParam(value = "html", required = false) MultipartFile htmlFile) {

        try {
            if (jsonFile != null && !jsonFile.isEmpty()) {
                String path = "course-preview/" + courseId + "/preview.json";
                minioService.uploadFile(jsonFile.getInputStream(), path, jsonFile.getContentType(), jsonFile.getSize());
            }
            if (heroImage != null && !heroImage.isEmpty()) {
                String path = "course-preview/" + courseId + "/hero.jpg";
                minioService.uploadFile(heroImage.getInputStream(), path, heroImage.getContentType(), heroImage.getSize());
            }
            if (heroVideo != null && !heroVideo.isEmpty()) {
                String path = "course-preview/" + courseId + "/hero.mp4";
                minioService.uploadFile(heroVideo.getInputStream(), path, heroVideo.getContentType(), heroVideo.getSize());
            }
            if (htmlFile != null && !htmlFile.isEmpty()) {
                String path = "course-preview/" + courseId + "/content.html";
                minioService.uploadFile(htmlFile.getInputStream(), path, htmlFile.getContentType(), htmlFile.getSize());
            }

            return "Превью курса #" + courseId + " успешно обновлено!";
        } catch (Exception e) {
            throw new RuntimeException("Ошибка загрузки превью: " + e.getMessage());
        }
    }
}