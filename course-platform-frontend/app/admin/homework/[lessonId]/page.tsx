'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

interface Homework {
  id: number;
  title: string;
  description: string;
}

export default function AdminHomeworkPage() {
  const { lessonId } = useParams();
  const router = useRouter();
  const [homework, setHomework] = useState<Homework[]>([]);
  const [lessonTitle, setLessonTitle] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/admin/lessons/${lessonId}`),
      api.get(`/lessons/${lessonId}/homework`)
    ]).then(([lessonRes, homeworkRes]) => {
      setLessonTitle(lessonRes.data.title);
      setHomework(homeworkRes.data);
      setLoading(false);
    }).catch(err => console.error(err));
  }, [lessonId]);

  const createHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/lessons/${lessonId}/homework`, { title, description });
      setTitle('');
      setDescription('');
      const res = await api.get(`/lessons/${lessonId}/homework`);
      setHomework(res.data);
    } catch (err) {
      alert('Ошибка при создании');
    }
  };

  const deleteHomework = async (id: number) => {
    if (confirm('Удалить задание?')) {
      await api.delete(`/lessons/${lessonId}/homework/${id}`);
      setHomework(homework.filter(h => h.id !== id));
    }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="form-page">
      <h1>Домашние задания</h1>
      <p>Урок: {lessonTitle}</p>

      <div>
        <h2>Создать задание</h2>
        <form onSubmit={createHomework}>
          <div>
            <label>Название</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <label>Описание</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <button type="submit">Добавить</button>
        </form>
      </div>

      <div>
        <h2>Список заданий</h2>
        {homework.length === 0 ? (
          <p>Нет заданий</p>
        ) : (
          homework.map(hw => (
            <div key={hw.id}>
              <div>
                <strong>{hw.title}</strong>
                <p>{hw.description}</p>
              </div>
              <button onClick={() => deleteHomework(hw.id)}>🗑️</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}