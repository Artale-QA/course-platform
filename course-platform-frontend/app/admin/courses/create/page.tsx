'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function CreateCoursePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/admin/courses', { title, description });
      router.push('/admin/courses');
    } catch (err) {
      alert('Ошибка при создании курса');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <h1>Новый курс</h1>
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
          <button type="submit" disabled={loading}>{loading ? 'Сохранение...' : 'Создать курс'}</button>
          <button type="button" onClick={() => router.back()}>Отмена</button>
        </div>
      </form>
    </div>
  );
}