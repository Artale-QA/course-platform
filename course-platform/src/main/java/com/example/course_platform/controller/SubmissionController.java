package com.example.course_platform.controller;

import com.example.course_platform.dto.CheckRequest;
import com.example.course_platform.entity.Lesson;
import com.example.course_platform.entity.Submission;
import com.example.course_platform.entity.User;
import com.example.course_platform.repository.LessonRepository;
import com.example.course_platform.repository.SubmissionRepository;
import com.example.course_platform.repository.UserRepository;
import com.example.course_platform.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/submissions")
public class SubmissionController {

    @Autowired
    private SubmissionRepository submissionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private FileStorageService fileStorageService;

    // Получить все непроверенные работы (УЧИТЕЛЬ и АДМИН)
    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public List<Submission> getPendingSubmissions() {
        return submissionRepository.findByStatus("PENDING");
    }

    @GetMapping("/lesson/{lessonId}/history")
    @PreAuthorize("hasRole('STUDENT')")
    public List<Submission> getSubmissionHistory(@PathVariable Long lessonId, Authentication authentication) {
        String email = authentication.getName();
        User student = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Студент не найден"));

        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new RuntimeException("Урок не найден"));

        // Возвращаем ВСЕ работы по уроку (история)
        return submissionRepository.findByLessonAndStudentOrderBySubmittedAtDesc(lesson, student);
    }

    @GetMapping("/lesson/{lessonId}/my-submission")
    @PreAuthorize("hasRole('STUDENT')")
    public Submission getMySubmission(@PathVariable Long lessonId, Authentication authentication) {
        String email = authentication.getName();
        User student = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Студент не найден"));

        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new RuntimeException("Урок не найден"));

        // Берём последнюю работу (первую в списке)
        List<Submission> submissions = submissionRepository.findAllByLessonAndStudentOrderBySubmittedAtDesc(lesson, student);
        return submissions.isEmpty() ? null : submissions.get(0);
    }

    // Проверить работу (УЧИТЕЛЬ и АДМИН)
    @PutMapping("/{id}/check")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public Submission checkSubmission(@PathVariable Long id, @RequestBody CheckRequest checkRequest) {
        Submission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Работа не найдена"));

        submission.setStatus(checkRequest.getStatus());  // APPROVED или REJECTED
        submission.setTeacherComment(checkRequest.getTeacherComment());
        submission.setCheckedAt(LocalDateTime.now());

        return submissionRepository.save(submission);
    }

    // Отправить работу (только STUDENT)
    @PostMapping(value = "/submit/{lessonId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('STUDENT')")
    public Submission submitHomework(
            @PathVariable Long lessonId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "comment", required = false) String comment,
            Authentication authentication) {

        String email = authentication.getName();
        User student = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Студент не найден"));

        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new RuntimeException("Урок не найден"));

        // Ищем ВСЕ работы студента по этому уроку и берём последнюю
        List<Submission> existingSubmissions = submissionRepository.findAllByLessonAndStudentOrderBySubmittedAtDesc(lesson, student);
        Submission latestSubmission = existingSubmissions.isEmpty() ? null : existingSubmissions.get(0);

        // Если есть ПРИНЯТАЯ работа — нельзя отправлять новую
        if (latestSubmission != null && "APPROVED".equals(latestSubmission.getStatus())) {
            throw new RuntimeException("Работа уже принята. Нельзя отправить новую.");
        }

        // Сохраняем файл
        String filePath;
        filePath = fileStorageService.saveFile(file, lessonId);

        // ВСЕГДА создаём НОВУЮ запись (история сохраняется)
        Submission submission = new Submission();
        submission.setLesson(lesson);
        submission.setStudent(student);
        submission.setFilePath(filePath);
        submission.setComment(comment);
        submission.setStatus("PENDING");
        submission.setSubmittedAt(LocalDateTime.now());

        return submissionRepository.save(submission);
    }


    // Обновить работу (только если статус PENDING)
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('STUDENT')")
    public Submission updateSubmission(
            @PathVariable Long id,
            @RequestParam(value = "comment", required = false) String comment,
            @RequestParam(value = "file", required = false) MultipartFile file,
            Authentication authentication) {

        String email = authentication.getName();
        User student = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Студент не найден"));

        Submission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Работа не найдена"));

        if (!submission.getStudent().getId().equals(student.getId())) {
            throw new RuntimeException("Доступ запрещён");
        }

        // Только работы со статусом PENDING можно редактировать
        if (!"PENDING".equals(submission.getStatus())) {
            throw new RuntimeException("Нельзя изменить уже проверенную работу");
        }

        if (comment != null) {
            submission.setComment(comment);
        }

        if (file != null && !file.isEmpty()) {
            fileStorageService.deleteFile(submission.getFilePath());
            String newFilePath = fileStorageService.saveFile(file, submission.getLesson().getId());
            submission.setFilePath(newFilePath);
        }

        submission.setSubmittedAt(LocalDateTime.now());
        return submissionRepository.save(submission);
    }

    // Удалить работу (только если статус PENDING)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('STUDENT')")
    public void deleteSubmission(@PathVariable Long id, Authentication authentication) {
        String email = authentication.getName();
        User student = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Студент не найден"));

        Submission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Работа не найдена"));

        if (!submission.getStudent().getId().equals(student.getId())) {
            throw new RuntimeException("Доступ запрещён");
        }

        if (!"PENDING".equals(submission.getStatus())) {
            throw new RuntimeException("Нельзя удалить уже проверенную работу");
        }

        fileStorageService.deleteFile(submission.getFilePath());
        submissionRepository.deleteById(id);
    }
}