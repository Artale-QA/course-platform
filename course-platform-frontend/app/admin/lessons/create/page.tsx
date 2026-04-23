'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';

export default function CreateLessonPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [orderIndex, setOrderIndex] = useState(1);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) {
      alert('ID курса не указан');
      return;
    }
    
    setLoading(true);
    
    try {
      let videoUrl = '';
      
      // Загружаем видео в MinIO
      if (videoFile) {
        const formData = new FormData();
        formData.append('file', videoFile);
        formData.append('courseId', courseId);
        formData.append('orderIndex', orderIndex.toString());
        
        const uploadRes = await api.post('/admin/lessons/upload-video', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        videoUrl = uploadRes.data.videoUrl;
      }
      
      // Создаём урок
      await api.post(`/admin/courses/${courseId}/lessons`, {
        title,
        description,
        orderIndex,
        videoUrl
      });
      
      router.push(`/admin/courses/${courseId}/lessons`);
    } catch (err) {
      console.error(err);
      alert('Ошибка при создании урока');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <h1>Новый урок</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Название урока</label>
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            required 
          />
        </div>
        
        <div className="form-group">
          <label>Описание</label>
          <textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            rows={5} 
          />
        </div>
        
        <div className="form-group">
          <label>Порядковый номер</label>
          <input 
            type="number" 
            value={orderIndex} 
            onChange={(e) => setOrderIndex(parseInt(e.target.value))} 
            required 
          />
        </div>
        
        <div className="form-group">
          <label>Видео файл (MP4)</label>
          <input 
            type="file" 
            accept="video/mp4,video/webm" 
            onChange={(e) => setVideoFile(e.target.files?.[0] || null)} 
          />
        </div>
        
        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Сохранение...' : 'Создать урок'}
          </button>
          <button type="button" onClick={() => router.back()}>
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}