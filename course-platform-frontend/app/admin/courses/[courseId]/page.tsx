'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function EditCoursePage() {
  const { courseId } = useParams();  // ← courseId
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;
    
    api.get(`/courses/${courseId}`)
      .then(res => {
        setTitle(res.data.title);
        setDescription(res.data.description);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, [courseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/admin/courses/${courseId}`, { title, description });
      router.push('/admin/courses');
    } catch (err) {
      alert('Ошибка при обновлении');
    }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="form-page">
      <h1>Редактировать курс</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Название курса</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label>Описание</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} required />
        </div>
        <div>
          <button type="submit">Сохранить</button>
          <button type="button" onClick={() => router.back()}>Отмена</button>
        </div>
      </form>
    </div>
  );
}