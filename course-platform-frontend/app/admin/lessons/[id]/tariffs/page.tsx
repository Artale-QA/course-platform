'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

interface Tariff {
  id: number;
  name: string;
  title: string;
  description: string;
  price: number;
}

export default function LessonTariffsPage() {
  const params = useParams();
  const lessonId = params.id;
  const router = useRouter();
  const [allTariffs, setAllTariffs] = useState<Tariff[]>([]);
  const [selectedTariffs, setSelectedTariffs] = useState<number[]>([]);
  const [lessonTitle, setLessonTitle] = useState('');
  const [courseId, setCourseId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTariff, setEditingTariff] = useState<Tariff | null>(null);
  const [newTariff, setNewTariff] = useState({
    name: '',
    title: '',
    description: '',
    price: 0
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!lessonId) return;
    
    api.get(`/admin/lessons/${lessonId}`)
      .then(lessonRes => {
        setLessonTitle(lessonRes.data.title);
        const courseIdFromLesson = lessonRes.data.course.id;
        setCourseId(courseIdFromLesson);
        
        return Promise.all([
          api.get(`/admin/courses/${courseIdFromLesson}/tariffs`),
          api.get(`/admin/lessons/${lessonId}/tariffs`)
        ]);
      })
      .then(([tariffsRes, selectedRes]) => {
        setAllTariffs(tariffsRes.data);
        setSelectedTariffs(selectedRes.data.map((t: Tariff) => t.id));
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [lessonId]);

  const toggleTariff = (tariffId: number) => {
    setSelectedTariffs(prev =>
      prev.includes(tariffId) ? prev.filter(id => id !== tariffId) : [...prev, tariffId]
    );
  };

  const handleSave = async () => {
    await api.post(`/admin/lessons/${lessonId}/tariffs`, selectedTariffs);
    alert('Тарифы назначены!');
    router.back();
  };

  const handleCreateTariff = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const tariffToCreate = {
        name: newTariff.name,
        title: newTariff.title,
        description: newTariff.description,
        price: newTariff.price
      };
      const response = await api.post(`/admin/courses/${courseId}/tariffs`, tariffToCreate);
      setAllTariffs([...allTariffs, response.data]);
      setShowCreateForm(false);
      setNewTariff({ name: '', title: '', description: '', price: 0 });
      alert('Тариф создан!');
    } catch (err) {
      alert('Ошибка при создании тарифа');
    } finally {
      setCreating(false);
    }
  };

  const handleEditTariff = (tariff: Tariff) => {
    setEditingTariff(tariff);
    setNewTariff({
      name: tariff.name,
      title: tariff.title,
      description: tariff.description || '',
      price: tariff.price
    });
  };

  const handleUpdateTariff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTariff) return;
    setCreating(true);
    try {
      const response = await api.put(`/admin/tariffs/${editingTariff.id}`, newTariff);
      setAllTariffs(allTariffs.map(t => t.id === editingTariff.id ? response.data : t));
      setEditingTariff(null);
      setNewTariff({ name: '', title: '', description: '', price: 0 });
      alert('Тариф обновлён!');
    } catch (err) {
      alert('Ошибка при обновлении тарифа');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTariff = async (tariffId: number) => {
    if (!confirm('Удалить тариф? Это действие нельзя отменить.')) return;
    try {
      await api.delete(`/admin/tariffs/${tariffId}`);
      setAllTariffs(allTariffs.filter(t => t.id !== tariffId));
      setSelectedTariffs(selectedTariffs.filter(id => id !== tariffId));
      alert('Тариф удалён!');
    } catch (err) {
      alert('Ошибка при удалении тарифа');
    }
  };

  const cancelForm = () => {
    setShowCreateForm(false);
    setEditingTariff(null);
    setNewTariff({ name: '', title: '', description: '', price: 0 });
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="courses-page">
      <div className="courses-container">
        <div className="courses-header">
          <h1 className="courses-title">Назначение тарифов</h1>
          <p className="courses-subtitle">Урок: {lessonTitle}</p>
          <button onClick={() => setShowCreateForm(true)} className="btn-create">
            + Новый тариф
          </button>
        </div>

        {/* Форма создания/редактирования */}
        {(showCreateForm || editingTariff) && (
          <div className="form-container">
            <h3 className="form-title">{editingTariff ? 'Редактировать тариф' : 'Создать новый тариф'}</h3>
            <form onSubmit={editingTariff ? handleUpdateTariff : handleCreateTariff}>
              <div className="form-group">
                <label>Кодовое имя (BASIC, PRO, PREMIUM)</label>
                <input
                  type="text"
                  value={newTariff.name}
                  onChange={(e) => setNewTariff({ ...newTariff, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Название</label>
                <input
                  type="text"
                  value={newTariff.title}
                  onChange={(e) => setNewTariff({ ...newTariff, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Описание</label>
                <textarea
                  value={newTariff.description}
                  onChange={(e) => setNewTariff({ ...newTariff, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="form-group">
                <label>Цена</label>
                <input
                  type="number"
                  value={newTariff.price}
                  onChange={(e) => setNewTariff({ ...newTariff, price: parseInt(e.target.value) })}
                />
              </div>
              <div className="form-actions">
                <button type="submit" disabled={creating} className="btn-save">
                  {creating ? 'Сохранение...' : (editingTariff ? 'Обновить' : 'Создать')}
                </button>
                <button type="button" onClick={cancelForm} className="btn-cancel">Отмена</button>
              </div>
            </form>
          </div>
        )}

        {/* Список тарифов */}
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Цена</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {allTariffs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="users-td" style={{ textAlign: 'center' }}>
                    Нет тарифов для этого курса. Создайте первый тариф.
                  </td>
                </tr>
              ) : (
                allTariffs.map(tariff => (
                  <tr key={tariff.id}>
                    <td className="users-td">
                      <label className="tariff-label">
                        <input
                          type="checkbox"
                          checked={selectedTariffs.includes(tariff.id)}
                          onChange={() => toggleTariff(tariff.id)}
                        />
                        <span className="tariff-title">{tariff.title}</span>
                      </label>
                    </td>
                    <td className="users-td">
                      {tariff.price === 0 ? 'Бесплатно' : `${tariff.price} ₽`}
                    </td>
                    <td className="users-td">
                      <button onClick={() => handleEditTariff(tariff)} className="btn-edit">✏️</button>
                      <button onClick={() => handleDeleteTariff(tariff.id)} className="btn-delete">🗑️</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="form-actions">
          <button onClick={handleSave} className="btn-save">Сохранить</button>
          <button onClick={() => router.back()} className="btn-cancel">Отмена</button>
        </div>
      </div>
    </div>
  );
}