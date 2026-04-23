'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function CreateTariffPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/admin/tariffs', { name, title, description, price });
      router.push('/admin/tariffs');
    } catch (err) {
      alert('Ошибка при создании тарифа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <h1>Новый тариф</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Кодовое имя</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="BASIC, PRO, PREMIUM" required />
        </div>
        <div>
          <label>Название</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label>Описание</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </div>
        <div>
          <label>Цена</label>
          <input type="number" value={price} onChange={(e) => setPrice(parseInt(e.target.value))} />
        </div>
        <div>
          <button type="submit" disabled={loading}>{loading ? 'Сохранение...' : 'Создать тариф'}</button>
          <button type="button" onClick={() => router.back()}>Отмена</button>
        </div>
      </form>
    </div>
  );
}