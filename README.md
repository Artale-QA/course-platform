<div align="center">
  <img src="https://img.shields.io/badge/Spring%20Boot-4.0.5-6DB33F?style=for-the-badge&logo=springboot&logoColor=white" alt="Spring Boot">
  <img src="https://img.shields.io/badge/Next.js-15.0-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/PostgreSQL-18-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  
  <h1>📚 Course Platform</h1>
  <p><strong>Современная образовательная платформа с микросервисной архитектурой</strong></p>
  
  <a href="#-особенности">Особенности</a> •
  <a href="#-технологии">Технологии</a> •
  <a href="#-быстрый-старт">Быстрый старт</a> •
  <a href="#-нагрузочное-тестирование">Тестирование</a> •
  <a href="#-api-документация">API</a>
</div>

---

## 🎯 О проекте

**Course Platform** — это полноценная LMS (Learning Management System) для онлайн-образования. Платформа позволяет создавать курсы, управлять уроками, проверять домашние задания и обрабатывать платежи.

### 🚀 Демонстрация навыков

| Навык | Реализация |
|-------|------------|
| 🏗️ **Архитектура** | Clean Architecture, разделение на слои |
| 🔐 **Безопасность** | JWT авторизация, роли (Admin/Teacher/Student) |
| 🐳 **Контейнеризация** | Docker Compose для 4 сервисов |
| 📊 **Базы данных** | PostgreSQL, Hibernate, миграции |
| ☁️ **Облачное хранилище** | MinIO (S3-совместимое) |
| 📈 **Нагрузочное тестирование** | Gatling (30+ RPS) |
| 🧪 **Юнит-тестирование** | JUnit 5 + Mockito |
| 📝 **Документация** | Swagger/OpenAPI |
| 🎨 **Frontend** | Next.js 15, TypeScript, CSS Modules |
| 🎯 **State Management** | React Hooks (useState, useEffect) |
| 📡 **HTTP клиент** | Axios |

---

## ✨ Особенности

### 👤 **Пользователи и роли**
- Регистрация и JWT аутентификация
- Три роли: **Admin**, **Teacher**, **Student**
- Разные права доступа к контенту

### 📖 **Курсы и уроки**
- Создание и управление курсами
- Загрузка материалов (видео)
- Структурированные уроки с контентом

### 📝 **Домашние задания**
- Прикрепление файлов к ДЗ
- Проверка учителем
- Оценки и комментарии

### 💳 **Платежи**
- Симуляция оплаты курсов
- Тарифы и подписки
- Доступ к премиум контенту

---

## 🛠 Технологии

### Backend
 - Spring Boot 4.0.5 → Основной фреймворк
 - Spring Security → Аутентификация и авторизация
 - JWT → Токены доступа
 - Hibernate/JPA → ORM, работа с БД
 - PostgreSQL 18 → Реляционная БД
 - MinIO → S3-хранилище для файлов
 - JUnit 5 + Mockito → Юнит-тестирование
 - Gatling → Нагрузочное тестирование

### Frontend
 - Next.js 15 → React фреймворк с SSR
 - TypeScript → Типизация
 - CSS Modules → Стилизация компонентов
 - Axios → HTTP клиент
 - React Hooks → Управление состоянием

### DevOps
 - Docker / Docker Compose → Контейнеризация
 - Maven → Сборка
 - GitHub Actions → CI/CD (планируется)


## 🚀 Быстрый старт

### 📋 Требования
- Docker Desktop 4.25+
- Java 17+
- Node.js 18+

### 🔧 Установка и запуск

```bash
# 1. Клонировать репозиторий
git clone https://github.com/Artale_QA/course-platform.git
cd course-platform

# 2. Запустить все сервисы одной командой
docker-compose up -d

# 3. Дождаться запуска (30 секунд)
docker-compose ps

# 4. Открыть в браузере
# Frontend: http://localhost:3000
# Backend: http://localhost:8080
# Swagger: http://localhost:8080/swagger-ui.html
# MinIO Console: http://localhost:9001
```

## 🔑 Доступы по умолчанию
| Сервис | Логин | Пароль |
|--------|-------|--------|
| **MinIO Console** | minioadmin | minioadmin123 |
| **PostgreSQL** | admin| admin123 |
| **Бэкенд (JWT)** | любой email | 123456 |

---

## 📊 Нагрузочное тестирование
# Gatling тесты

```bash:
# Регистрация пользователей (30 пользователей за 30 секунд)
./mvnw gatling:test -Dgatling.simulationClass=com.example.course_platform.AuthSimulation

# Сценарии покупки курса
./mvnw gatling:test -Dgatling.simulationClass=com.example.course_platform.PaymentSimulation
Результаты тестов:

✅ 30 RPS стабильно
✅ 0% ошибок при нагрузке
✅ Средний ответ API: <200ms

```

### Основные эндпоинты

```bash
# Аутентификация
POST /auth/register    - Регистрация
POST /auth/login       - Вход (JWT токен)

# Курсы
GET  /courses          - Список курсов
GET  /courses/{id}     - Детали курса
POST /courses          - Создать курс (Teacher)

# Уроки
GET  /lessons/{id}     - Урок с материалами
POST /lessons          - Создать урок

# Домашние задания
POST /submissions      - Отправить ДЗ
GET  /submissions/{id} - Проверить ДЗ (Teacher)

# Платежи
POST /payments/simulate - Симуляция оплаты

# Админ панель
GET  /admin/users      - Список пользователей
PUT  /admin/users/{id}/role - Сменить роль
```

## 📡 API Документация
После запуска доступен Swagger UI:

http://localhost:8080/swagger-ui.html

## 📞 Контакты
 - Автор: Artale_QA
 - GitHub: github.com/Artale_QA

