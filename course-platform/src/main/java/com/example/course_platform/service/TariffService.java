package com.example.course_platform.service;

import com.example.course_platform.entity.Lesson;
import com.example.course_platform.entity.Tariff;
import com.example.course_platform.entity.User;
import com.example.course_platform.entity.UserTariff;
import com.example.course_platform.repository.LessonRepository;
import com.example.course_platform.repository.TariffLessonRepository;
import com.example.course_platform.repository.TariffRepository;
import com.example.course_platform.repository.UserTariffRepository;
import org.hibernate.Hibernate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class TariffService {

    @Autowired
    private TariffRepository tariffRepository;

    @Autowired
    private UserTariffRepository userTariffRepository;

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private TariffLessonRepository tariffLessonRepository;

    // Получить активный тариф пользователя
    public Tariff getUserActiveTariff(User user) {
        if (user == null) return null;
        return userTariffRepository.findTopByUserIdAndIsActiveTrueOrderByCreatedAtDesc(user.getId())
                .map(ut -> {
                    // Проверяем срок действия
                    if (ut.getExpiresAt() != null && ut.getExpiresAt().isBefore(LocalDateTime.now())) {
                        ut.setIsActive(false);
                        userTariffRepository.save(ut);
                        return null;
                    }
                    return ut.getTariff();
                })
                .orElse(null);
    }

    // Проверить, имеет ли пользователь доступ ко всем урокам курса (купил ли тариф)
    public boolean hasAccessToCourse(User user, Long courseId) {
        if (user == null) return false;

        String role = user.getRole().getName();
        if ("ADMIN".equals(role) || "TEACHER".equals(role) || "MODERATOR".equals(role)) {
            return true;
        }

        if ("STUDENT".equals(role)) {
            Tariff tariff = getUserActiveTariff(user);
            if (tariff == null) return false;

            // Используем запрос в репозиторий вместо загрузки коллекции
            return tariffRepository.hasLessonInCourse(tariff.getId(), courseId);
        }

        return false;
    }

    public boolean hasAccessToLesson(User user, Lesson lesson) {
        // Проверяем, есть ли у урока вообще какие-либо тарифы
        boolean hasTariffs = tariffLessonRepository.existsByLessonId(lesson.getId());

        // Если у урока нет тарифов — доступен всем
        if (!hasTariffs) {
            return true;
        }

        // Администраторы, учителя, модераторы имеют доступ ко всем урокам
        if (user != null && ("ADMIN".equals(user.getRole().getName()) ||
                "TEACHER".equals(user.getRole().getName()) ||
                "MODERATOR".equals(user.getRole().getName()))) {
            return true;
        }

        // Неавторизованные — только уроки из BASIC тарифа
        if (user == null) {
            Tariff basicTariff = tariffRepository.findByName("BASIC").orElse(null);
            if (basicTariff != null) {
                return tariffRepository.isLessonInTariff(basicTariff.getId(), lesson.getId());
            }
            return false;
        }

        // Студенты — по их активному тарифу
        if ("STUDENT".equals(user.getRole().getName())) {
            Tariff tariff = getUserActiveTariff(user);
            if (tariff == null) return false;
            return tariffRepository.isLessonInTariff(tariff.getId(), lesson.getId());
        }

        return false;
    }

    // Получить все доступные уроки для пользователя
    public List<Lesson> getAvailableLessons(User user) {
        List<Lesson> allLessons = lessonRepository.findAll();

        if (user == null) {
            Tariff basicTariff = tariffRepository.findByName("BASIC").orElse(null);
            if (basicTariff != null) {
                return basicTariff.getLessons();
            }
            return List.of();
        }

        if ("ADMIN".equals(user.getRole().getName()) ||
                "TEACHER".equals(user.getRole().getName()) ||
                "MODERATOR".equals(user.getRole().getName())) {
            return allLessons;
        }

        if ("STUDENT".equals(user.getRole().getName())) {
            Tariff tariff = getUserActiveTariff(user);
            if (tariff != null) {
                return tariff.getLessons();
            }
        }

        return List.of();
    }

    @Transactional(readOnly = true)
    public List<Tariff> getAllTariffs() {
        List<Tariff> tariffs = tariffRepository.findByIsActiveTrueOrderBySortOrderAsc();
        tariffs.forEach(tariff -> {
            Hibernate.initialize(tariff.getLessons());
        });
        return tariffs;
    }

    // Активировать тариф для пользователя
    @Transactional
    public UserTariff assignTariff(User user, String tariffName, Integer durationDays) {
        Tariff tariff = tariffRepository.findByName(tariffName)
                .orElseThrow(() -> new RuntimeException("Тариф не найден"));

        // Деактивируем старые тарифы
        List<UserTariff> oldTariffs = userTariffRepository.findByUserIdAndIsActiveTrue(user.getId());
        oldTariffs.forEach(ut -> ut.setIsActive(false));
        userTariffRepository.saveAll(oldTariffs);

        UserTariff userTariff = new UserTariff();
        userTariff.setUser(user);
        userTariff.setTariff(tariff);

        if (durationDays != null && durationDays > 0) {
            userTariff.setExpiresAt(LocalDateTime.now().plusDays(durationDays));
        }

        return userTariffRepository.save(userTariff);
    }

    // Админ: назначить уроки тарифу
    @Transactional
    public void assignLessonsToTariff(Long tariffId, List<Long> lessonIds) {
        Tariff tariff = tariffRepository.findById(tariffId)
                .orElseThrow(() -> new RuntimeException("Тариф не найден"));

        List<Lesson> lessons = lessonRepository.findAllById(lessonIds);
        tariff.setLessons(lessons);
        tariff.setUpdatedAt(LocalDateTime.now());
        tariffRepository.save(tariff);
    }

    // Получить тариф по ID
    public Tariff getTariffById(Long id) {
        return tariffRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Тариф не найден"));
    }

    // Создать новый тариф
    public Tariff createTariff(Tariff tariff) {
        tariff.setCreatedAt(LocalDateTime.now());
        tariff.setUpdatedAt(LocalDateTime.now());
        return tariffRepository.save(tariff);
    }

    // Обновить тариф
    public Tariff updateTariff(Long id, Tariff tariffDetails) {
        Tariff tariff = getTariffById(id);
        tariff.setName(tariffDetails.getName());
        tariff.setTitle(tariffDetails.getTitle());
        tariff.setDescription(tariffDetails.getDescription());
        tariff.setPrice(tariffDetails.getPrice());
        tariff.setSortOrder(tariffDetails.getSortOrder());
        tariff.setIsActive(tariffDetails.getIsActive());
        tariff.setUpdatedAt(LocalDateTime.now());
        return tariffRepository.save(tariff);
    }

    // Удалить тариф
    public void deleteTariff(Long id) {
        Tariff tariff = getTariffById(id);
        tariff.setIsActive(false);
        tariff.setUpdatedAt(LocalDateTime.now());
        tariffRepository.save(tariff);
    }
}