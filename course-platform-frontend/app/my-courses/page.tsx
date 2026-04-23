'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api, { Course } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function MyCoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      return;
    }
    
    api.get('/users/my-courses')
      .then(res => {
        setCourses(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [user]);

  return (
    <div className="courses-page">
      <div className="courses-container">
        <div className="courses-header">
          <h1 className="courses-title">Мои курсы</h1>
          <p className="courses-subtitle">Продолжи обучение с того места, где остановился</p>
        </div>
        
        {/* Контент после загрузки */}
        {!loading && !user && (
          <div className="auth-warning" style={{ textAlign: 'center' }}>
            <p className="auth-warning-text">🔒 Необходимо войти</p>
            <Link href="/login" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-flex' }}>
              Войти
            </Link>
          </div>
        )}
        
        {!loading && user && courses.length === 0 && (
          <div className="auth-warning" style={{ textAlign: 'center' }}>
            <p className="auth-warning-text">✨ Вы ещё не записаны ни на один курс</p>
            <Link href="/courses" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-flex' }}>
              Перейти к курсам →
            </Link>
          </div>
        )}
        
        {!loading && user && courses.length > 0 && (
          <div className="courses-grid">
            {courses.map(course => (
              <Link 
                key={course.id} 
                href={`/courses/${course.id}`} 
                className="course-link"
              >
                <div className="course-card">
                  <div className="course-card-content">
                    <h2 className="course-title">{course.title}</h2>
                    <p className="course-description">{course.description}</p>
                    {course.lessonsCount && (
                      <div className="course-meta">
                        <span className="course-lessons-icon">📚</span>
                        <span className="course-lessons">{course.lessonsCount} уроков</span>
                      </div>
                    )}
                  </div>
                  <div className="course-card-arrow">
                    <span className="arrow-icon">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}