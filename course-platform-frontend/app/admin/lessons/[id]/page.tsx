'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function EditLessonPage() {
  const { id } = useParams();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [orderIndex, setOrderIndex] = useState(1);
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/admin/lessons/${id}`)
      .then(res => {
        setTitle(res.data.title);
        setDescription(res.data.description || '');
        setOrderIndex(res.data.orderIndex);
        setVideoUrl(res.data.videoUrl || '');
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/admin/lessons/${id}`, { title, description, orderIndex, videoUrl });
      router.back();
    } catch (err) {
      alert('Ошибка при обновлении');
    }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="form-page">
      <h1>Редактировать урок</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Название урока</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label>Описание</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} />
        </div>
        <div>
          <label>Порядковый номер</label>
          <input type="number" value={orderIndex} onChange={(e) => setOrderIndex(parseInt(e.target.value))} required />
        </div>
        <div>
          <label>Ссылка на видео (путь в MinIO)</label>
          <input type="text" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="lesson_1/video.mp4" />
        </div>
        <div>
          <button type="submit">Сохранить</button>
          <button type="button" onClick={() => router.back()}>Отмена</button>
        </div>
      </form>
    </div>
  );
}