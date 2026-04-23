'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface Tariff {
  id: number;
  name: string;
  title: string;
  description: string;
  price: number;
}

export default function AdminTariffsPage() {
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/tariffs')
      .then(res => {
        setTariffs(res.data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  const deleteTariff = async (id: number) => {
    if (confirm('Удалить тариф?')) {
      await api.delete(`/admin/tariffs/${id}`);
      setTariffs(tariffs.filter(t => t.id !== id));
    }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Тарифы</h1>
        <Link href="/admin/tariffs/create">+ Новый тариф</Link>
      </div>

      <div className="admin-list">
        {tariffs.map(tariff => (
          <div key={tariff.id}>
            <div>
              <h3>{tariff.title}</h3>
              <p>{tariff.description}</p>
              <p>{tariff.price === 0 ? 'Бесплатно' : `${tariff.price} ₽`}</p>
            </div>
            <div>
              <Link href={`/admin/tariffs/${tariff.id}`}>✏️</Link>
              <button onClick={() => deleteTariff(tariff.id)}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}