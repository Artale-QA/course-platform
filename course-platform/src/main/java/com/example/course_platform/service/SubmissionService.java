package com.example.course_platform.service;

import com.example.course_platform.dto.SubmissionCheckDto;
import com.example.course_platform.dto.SubmissionResponseDto;
import com.example.course_platform.entity.Lesson;
import com.example.course_platform.entity.Submission;
import com.example.course_platform.entity.User;
import com.example.course_platform.repository.LessonRepository;
import com.example.course_platform.repository.SubmissionRepository;
import com.example.course_platform.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SubmissionService {

    @Autowired
    private SubmissionRepository submissionRepository;

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FileStorageService fileStorageService;

    // Отправить работу (студент)
    public SubmissionResponseDto submitHomework(Long lessonId, Long studentId, MultipartFile file, String comment) {
        // Проверка существования урока
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new RuntimeException("Урок не найден"));

        // Проверка существования студента
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Студент не найден"));

        // Проверка, не отправлял ли уже студент работу к этому уроку
        if (submissionRepository.findByLessonIdAndStudentId(lessonId, studentId).isPresent()) {
            throw new RuntimeException("Вы уже отправили работу к этому уроку");
        }

        // Сохранение файла в MinIO
        String filePath;
        filePath = fileStorageService.saveFile(file, lessonId);

        // Создание записи
        Submission submission = new Submission();
        submission.setLesson(lesson);
        submission.setStudent(student);
        submission.setFilePath(filePath);
        submission.setComment(comment);
        submission.setStatus("PENDING");
        submission.setSubmittedAt(LocalDateTime.now());

        Submission saved = submissionRepository.save(submission);
        return convertToResponseDto(saved);
    }

    // Получить все работы к уроку (учитель)
    public List<SubmissionResponseDto> getSubmissionsByLessonId(Long lessonId) {
        List<Submission> submissions = submissionRepository.findByLessonId(lessonId);
        return submissions.stream()
                .map(this::convertToResponseDto)
                .collect(Collectors.toList());
    }

    // Получить работы студента
    public List<SubmissionResponseDto> getSubmissionsByStudentId(Long studentId) {
        List<Submission> submissions = submissionRepository.findByStudentId(studentId);
        return submissions.stream()
                .map(this::convertToResponseDto)
                .collect(Collectors.toList());
    }

    // Получить непроверенные работы урока
    public List<SubmissionResponseDto> getPendingSubmissionsByLessonId(Long lessonId) {
        List<Submission> submissions = submissionRepository.findByLessonIdAndStatus(lessonId, "PENDING");
        return submissions.stream()
                .map(this::convertToResponseDto)
                .collect(Collectors.toList());
    }

    // Получить все непроверенные работы
    public List<SubmissionResponseDto> getPendingSubmissions() {
        List<Submission> submissions = submissionRepository.findByStatus("PENDING");
        return submissions.stream()
                .map(this::convertToResponseDto)
                .collect(Collectors.toList());
    }

    // Получить работу студента по уроку (последнюю)
    public SubmissionResponseDto getMySubmission(Long lessonId, String email) {
        User student = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Студент не найден"));

        Submission submission = submissionRepository.findByLessonIdAndStudentId(lessonId, student.getId())
                .orElse(null);

        return submission != null ? convertToResponseDto(submission) : null;
    }

    // Получить историю работ студента по уроку
    public List<SubmissionResponseDto> getSubmissionHistory(Long lessonId, String email) {
        User student = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Студент не найден"));

        List<Submission> submissions = submissionRepository.findByLessonIdAndStudentIdOrderBySubmittedAtDesc(lessonId, student.getId());
        return submissions.stream()
                .map(this::convertToResponseDto)
                .collect(Collectors.toList());
    }

    // Обновить работу (только если статус PENDING)
    public SubmissionResponseDto updateSubmission(Long id, String comment, MultipartFile file, String email) {
        User student = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Студент не найден"));

        Submission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Работа не найдена"));

        // Проверка, что работа принадлежит студенту
        if (!submission.getStudent().getId().equals(student.getId())) {
            throw new RuntimeException("Доступ запрещён");
        }

        // Проверка, что работа ещё не проверена
        if (!"PENDING".equals(submission.getStatus())) {
            throw new RuntimeException("Нельзя изменить уже проверенную работу");
        }

        if (comment != null) {
            submission.setComment(comment);
        }

        if (file != null && !file.isEmpty()) {
            // Удаляем старый файл из MinIO
            fileStorageService.deleteFile(submission.getFilePath());
            // Сохраняем новый в MinIO
            String newFilePath = fileStorageService.saveFile(file, submission.getLesson().getId());
            submission.setFilePath(newFilePath);
        }

        submission.setSubmittedAt(LocalDateTime.now());
        Submission saved = submissionRepository.save(submission);
        return convertToResponseDto(saved);
    }

    // Удалить работу (только если статус PENDING)
    public void deleteSubmission(Long id, String email) {
        User student = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Студент не найден"));

        Submission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Работа не найдена"));

        // Проверка, что работа принадлежит студенту
        if (!submission.getStudent().getId().equals(student.getId())) {
            throw new RuntimeException("Доступ запрещён");
        }

        // Проверка, что работа ещё не проверена
        if (!"PENDING".equals(submission.getStatus())) {
            throw new RuntimeException("Нельзя удалить уже проверенную работу");
        }

        // Удаляем файл из MinIO
        fileStorageService.deleteFile(submission.getFilePath());

        // Удаляем запись
        submissionRepository.deleteById(id);
    }

    // Проверить работу (учитель)
    public SubmissionResponseDto checkSubmission(Long submissionId, SubmissionCheckDto checkDto) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Работа не найдена"));

        submission.setStatus(checkDto.getStatus());
        submission.setTeacherComment(checkDto.getTeacherComment());
        submission.setCheckedAt(LocalDateTime.now());

        Submission saved = submissionRepository.save(submission);
        return convertToResponseDto(saved);
    }

    private String getFileType(String filePath) {
        if (filePath == null) return "application/octet-stream";

        String lowerPath = filePath.toLowerCase();
        if (lowerPath.endsWith(".mp4")) return "video/mp4";
        if (lowerPath.endsWith(".webm")) return "video/webm";
        if (lowerPath.endsWith(".mov")) return "video/quicktime";
        if (lowerPath.endsWith(".pdf")) return "application/pdf";
        if (lowerPath.endsWith(".jpg") || lowerPath.endsWith(".jpeg")) return "image/jpeg";
        if (lowerPath.endsWith(".png")) return "image/png";
        if (lowerPath.endsWith(".gif")) return "image/gif";
        if (lowerPath.endsWith(".mp3")) return "audio/mpeg";

        return "application/octet-stream";
    }

    // Конвертация в DTO
    private SubmissionResponseDto convertToResponseDto(Submission submission) {
        String fileType = getFileType(submission.getFilePath());
        System.out.println("=== DEBUG ===");
        System.out.println("filePath: " + submission.getFilePath());
        System.out.println("fileType: " + fileType);

        SubmissionResponseDto dto = SubmissionResponseDto.builder()
                .id(submission.getId())
                .studentName(submission.getStudent().getFullName())
                .studentEmail(submission.getStudent().getEmail())
                .filePath(submission.getFilePath())
                .fileType(fileType)
                .comment(submission.getComment())
                .status(submission.getStatus())
                .teacherComment(submission.getTeacherComment())
                .submittedAt(submission.getSubmittedAt())
                .checkedAt(submission.getCheckedAt())
                .build();

        System.out.println("DTO fileType: " + dto.getFileType());
        return dto;
    }
}