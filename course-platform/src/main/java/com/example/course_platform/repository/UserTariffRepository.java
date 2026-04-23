package com.example.course_platform.repository;

import com.example.course_platform.entity.UserTariff;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserTariffRepository extends JpaRepository<UserTariff, Long> {
    Optional<UserTariff> findTopByUserIdAndIsActiveTrueOrderByCreatedAtDesc(Long userId);
    List<UserTariff> findByUserIdAndIsActiveTrue(Long userId);
}
