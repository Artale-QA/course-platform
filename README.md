\# Course Platform



Educational platform for online courses with user authentication, course management, and file storage.



\## Tech Stack

\- \*\*Backend\*\*: Spring Boot 4.0, Spring Security, JWT, JPA/Hibernate

\- \*\*Frontend\*\*: Next.js 15, TypeScript, Tailwind CSS

\- \*\*Database\*\*: PostgreSQL 18

\- \*\*Storage\*\*: MinIO (S3-compatible)

\- \*\*Testing\*\*: Gatling for load testing

\- \*\*Container\*\*: Docker, Docker Compose



\## Quick Start



```bash

\# Clone repository

git clone https://github.com/YOUR\_USERNAME/course-platform.git



\# Start all services

cd course-platform

docker-compose up -d



\# Access

\- Frontend: http://localhost:3000

\- Backend API: http://localhost:8080

\- Swagger UI: http://localhost:8080/swagger-ui.html

\- MinIO Console: http://localhost:9001 (minioadmin/minioadmin123)

