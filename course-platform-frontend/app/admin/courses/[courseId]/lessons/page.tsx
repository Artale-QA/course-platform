'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

interface Lesson {
  id: number;
  title: string;
  orderIndex: number;
  videoUrl?: string;
}

export default function AdminLessonsPage() {
  const { courseId } = useParams();
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courseTitle, setCourseTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;
    
    Promise.all([
      api.get(`/courses/${courseId}`),
      api.get(`/admin/courses/${courseId}/lessons`)
    ]).then(([courseRes, lessonsRes]) => {
      setCourseTitle(courseRes.data.title);
      setLessons(lessonsRes.data);
      setLoading(false);
    }).catch(err => console.error(err));
  }, [courseId]);

  const deleteLesson = async (lessonId: number) => {
    if (confirm('Удалить урок?')) {
      await api.delete(`/admin/lessons/${lessonId}`);
      setLessons(lessons.filter(l => l.id !== lessonId));
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="courses-page">
      <div className="courses-container">
        <div className="courses-header">
          <h1 className="courses-title">Уроки курса: {courseTitle}</h1>
          <p className="courses-subtitle">Управление уроками курса</p>
          <Link href={`/admin/lessons/create?courseId=${courseId}`} className="btn-create">
            + Новый урок
          </Link>
        </div>
        
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Порядок</th>
                <th>Название</th>
                <th>Видео</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map(lesson => (
                <tr key={lesson.id}>
                  <td className="users-td">{lesson.orderIndex}</td>
                  <td className="users-td">{lesson.title}</td>
                  <td className="users-td">{lesson.videoUrl ? '🎥' : '—'}</td>
                  <td className="users-td">
                    <Link href={`/admin/lessons/${lesson.id}`} className="btn-edit">✏️</Link>
                    <Link href={`/admin/lessons/${lesson.id}/tariffs`} className="btn-tariffs">💰</Link>
                    <Link href={`/admin/homework/${lesson.id}`} className="btn-homework">📝</Link>
                    <Link href={`/admin/lessons/${lesson.id}/materials`} className="btn-materials">📎</Link>
                    <button onClick={() => deleteLesson(lesson.id)} className="btn-delete">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}