'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function EditTariffPage() {
  const { id } = useParams();
  const router = useRouter();
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/tariffs/${id}`)
      .then(res => {
        setName(res.data.name);
        setTitle(res.data.title);
        setDescription(res.data.description || '');
        setPrice(res.data.price);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/admin/tariffs/${id}`, { name, title, description, price });
      router.push('/admin/tariffs');
    } catch (err) {
      alert('Ошибка при обновлении');
    }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="form-page">
      <h1>Редактировать тариф</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Кодовое имя</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
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
          <button type="submit">Сохранить</button>
          <button type="button" onClick={() => router.back()}>Отмена</button>
        </div>
      </form>
    </div>
  );
}