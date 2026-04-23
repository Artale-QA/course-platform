'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface Course {
  id: number;
  title: string;
  shortDescription: string;
  lessonsCount?: number;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.get<Course[]>('/courses/preview')
      .then(res => {
        setCourses(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="courses-page">
      <div className="courses-container">
        <div className="courses-header">
          <h1 className="courses-title">Курсы гитары</h1>
          <p className="courses-subtitle">Выберите курс и начните своё музыкальное путешествие</p>
        </div>
        
        <div className="courses-grid">
          {courses.map(course => (
            <Link key={course.id} href={`/courses/${course.id}`} className="course-link">
              <div className="course-card">
                <div className="course-card-content">
                  <h2 className="course-title">{course.title}</h2>
                  <p className="course-description">{course.shortDescription}</p>
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
      </div>
    </div>
  );
}