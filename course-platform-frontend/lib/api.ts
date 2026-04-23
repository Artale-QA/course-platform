import axios from 'axios';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: 'STUDENT' | 'TEACHER' | 'MODERATOR' | 'ADMIN';
}

export interface Course {
  id: number;
  title: string;
  description: string;
  shortDescription?: string;
  lessonsCount?: number;
}

export interface Lesson {
  id: number;
  title: string;
  description: string;
  orderIndex: number;
  courseId: number;
}

export interface Submission {
  id: number;
  studentName: string;
  studentEmail: string;
  filePath: string;
  comment: string;
  status: 'PENDING' | 'CHECKED';
  teacherComment: string;
  submittedAt: string;
  checkedAt: string;
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Добавляем токен к каждому запросу
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ Добавь перехватчик для ответов
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Если 401 (Unauthorized) — очищаем токен и перенаправляем на логин
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Не перенаправляем, если уже на странице логина или регистрации
      if (typeof window !== 'undefined' && 
          !window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;