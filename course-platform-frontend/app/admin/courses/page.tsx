'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface Course {
  id: number;
  title: string;
  description: string;
}

export default function AdminCoursesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      if (!authLoading) router.push('/');
      return;
    }
    
    api.get('/admin/courses')
      .then(res => {
        setCourses(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        loading;
      });
  }, [user, authLoading]);

  const deleteCourse = async (id: number) => {
    if (confirm('Удалить курс? Все уроки также будут удалены.')) {
      await api.delete(`/admin/courses/${id}`);
      setCourses(courses.filter(c => c.id !== id));
    }
  };

  if (authLoading || loading) return <div className="loading">Загрузка...</div>;
  if (!user || user.role !== 'ADMIN') return <div className="access-denied">Доступ запрещён</div>;

  return (
    <div className="courses-page">
      <div className="courses-container">
        <div className="courses-header">
          <h1 className="courses-title">Курсы</h1>
          <p className="courses-subtitle">Управление курсами платформы</p>
          <Link href="/admin/courses/create" className="btn-create">
            + Новый курс
          </Link>
        </div>
        
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Название</th>
                <th>Описание</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(course => (
                <tr key={course.id}>
                  <td className="users-td">{course.id}</td>
                  <td className="users-td">{course.title}</td>
                  <td className="users-td">{course.description}</td>
                  <td className="users-td">
                    <Link href={`/admin/courses/${course.id}`} className="btn-edit">✏️</Link>
                    <Link href={`/admin/courses/${course.id}/lessons`} className="btn-lessons">📋</Link>
                    <button onClick={() => deleteCourse(course.id)} className="btn-delete">🗑️</button>
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