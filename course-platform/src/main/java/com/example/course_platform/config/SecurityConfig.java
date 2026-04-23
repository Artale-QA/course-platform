package com.example.course_platform.config;

import com.example.course_platform.service.CustomUserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private JwtFilter jwtFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // Открытая регистрация и логин
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers("/minio/download/**").permitAll()
                        .requestMatchers("/minio/view/**").permitAll()

                        // OPTIONS запросы пропускать без авторизации
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Swagger
                        .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()


                        // ========== MINIO (доступ авторизованным) ==========
                        //.requestMatchers("/minio/download/**").authenticated()
                        //.requestMatchers("/minio/url/**").authenticated()

                        // ========== ГОСТЬ ==========
                        .requestMatchers(HttpMethod.GET, "/courses").permitAll()
                        .requestMatchers(HttpMethod.GET, "/courses/preview").permitAll()
                        .requestMatchers(HttpMethod.GET, "/courses/{id}/preview").permitAll()
                        .requestMatchers(HttpMethod.GET, "/courses/{courseId}/lessons/preview").permitAll()
                        .requestMatchers(HttpMethod.GET, "/lessons/{id}/preview").permitAll()
                        .requestMatchers(HttpMethod.GET, "/lessons/first/{courseId}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/courses/{courseId}/lessons").permitAll()
                        .requestMatchers(HttpMethod.GET, "/courses/{courseId}/lessons/{id}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/courses/{id}/full").permitAll()
                        .requestMatchers(HttpMethod.GET, "/lessons/{id}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/courses/{id}/tariffs").permitAll()

                        // Оплата и симуляция платежа (только STUDENT)
                        .requestMatchers(HttpMethod.POST, "/payment/simulate").hasRole("STUDENT")

                        // ========== АВТОРИЗОВАННЫЕ (полный доступ к просмотру) ==========
                        .requestMatchers("/minio/upload/**").authenticated()  // Загрузка - только авторизованным
                        .requestMatchers("/minio/url/**").authenticated()     // Получение ссылки - только авторизованным
                        .requestMatchers("/minio/delete/**").authenticated()  // Удаление - только авторизованным
                        .requestMatchers(HttpMethod.GET, "/courses").authenticated()
                        .requestMatchers(HttpMethod.GET, "/courses/{id}").authenticated()
                        .requestMatchers(HttpMethod.GET, "/courses/{courseId}/lessons").authenticated()


                        // ✅ Админские эндпоинты для уроков
                        .requestMatchers(HttpMethod.GET, "/admin/lessons/{id}").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/admin/lessons/{id}").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/admin/lessons/{id}").hasRole("ADMIN")
                        // Админские эндпоинты для тарифов уроков
                        .requestMatchers(HttpMethod.GET, "/admin/lessons/{lessonId}/tariffs").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/admin/lessons/{lessonId}/tariffs").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/admin/tariffs").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/admin/tariffs").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/admin/tariffs/{id}").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/admin/tariffs/{id}").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/admin/courses/{courseId}/tariffs").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/admin/courses/{courseId}/tariffs").hasRole("ADMIN")
                        // ========== ДОМАШНИЕ ЗАДАНИЯ ==========
                        .requestMatchers(HttpMethod.POST, "/lessons/{lessonId}/homework").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/lessons/{lessonId}/homework/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/lessons/{lessonId}/homework/**").hasRole("ADMIN")
                        .requestMatchers("/admin/**").hasAnyRole("MODERATOR", "ADMIN")
                        .requestMatchers("/admin/users").hasAnyRole("MODERATOR", "ADMIN")
                        // Загрузка видео для уроков (только ADMIN)
                        .requestMatchers(HttpMethod.POST, "/admin/lessons/upload-video").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/lessons/{lessonId}/homework").authenticated()

                        // ========== РАБОТЫ (SUBMISSIONS) ==========
                        .requestMatchers(HttpMethod.POST, "/submissions/submit/**").hasRole("STUDENT")
                        .requestMatchers(HttpMethod.GET, "/submissions/lesson/{lessonId}/history").hasRole("STUDENT")
                        .requestMatchers(HttpMethod.GET, "/submissions/lesson/{lessonId}/my-submission").hasRole("STUDENT")
                        .requestMatchers(HttpMethod.PUT, "/submissions/{id}").hasRole("STUDENT")
                        .requestMatchers(HttpMethod.DELETE, "/submissions/{id}").hasRole("STUDENT")
                        .requestMatchers(HttpMethod.GET, "/submissions/lesson/**").hasAnyRole("TEACHER", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/submissions/pending").hasAnyRole("TEACHER", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/submissions/{id}/check").hasAnyRole("TEACHER", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/submissions/my").hasRole("STUDENT")
                        .requestMatchers(HttpMethod.GET, "/users/my-courses").hasAnyRole("STUDENT", "ADMIN")

                        // Всё остальное требует авторизации
                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                ).addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }
}