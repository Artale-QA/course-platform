'use client';

import { useEffect, useState } from 'react';
import api, { User } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface ApiUser {
  id: number;
  email: string;
  fullName: string;
  role: string | { id: number; name: string };
}

export default function UsersPage() {
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Состояния для модального окна
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<ApiUser | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'STUDENT'
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isModerator = user?.role === 'MODERATOR';
  const isAdmin = user?.role === 'ADMIN';

  const getRoleString = (role: string | { id: number; name: string }): string => {
    return typeof role === 'object' ? role.name : role;
  };

  useEffect(() => {
    if (!isModerator && !isAdmin) return;
    
    api.get('/admin/users')
      .then(res => {
        setUsers(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [isModerator, isAdmin]);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ email: '', password: '', fullName: '', role: 'STUDENT' });
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (userToEdit: ApiUser) => {
    setEditingUser(userToEdit);
    setFormData({
      email: userToEdit.email,
      password: '',
      fullName: userToEdit.fullName,
      role: getRoleString(userToEdit.role)
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      if (editingUser) {
        // Обновление пользователя (только ADMIN может менять роль)
        if (isAdmin && formData.role !== getRoleString(editingUser.role)) {
          await api.put(`/admin/users/${editingUser.id}/role`, { roleName: formData.role });
        }
        // Обновление имени (если изменилось)
        if (formData.fullName !== editingUser.fullName) {
          // TODO: добавить эндпоинт для обновления имени
        }
        alert('Пользователь обновлён');
      } else {
        // Создание нового пользователя
        await api.post('/admin/users', formData);
        alert('Пользователь создан');
      }
      
      // Обновляем список
      const res = await api.get('/admin/users');
      setUsers(res.data);
      setShowModal(false);
      
    } catch (err: any) {
      setFormError(err.response?.data || 'Ошибка при сохранении');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: number, userRole: string) => {
    if (isModerator && (userRole === 'ADMIN' || userRole === 'MODERATOR')) {
      alert('Модератор не может удалять администраторов или других модераторов');
      return;
    }
    
    if (confirm('Удалить пользователя?')) {
      await api.delete(`/admin/users/${userId}`);
      setUsers(users.filter(u => u.id !== userId));
    }
  };

  if (authLoading || loading) return <div className="loading">Загрузка...</div>;
  if (!isModerator && !isAdmin) return <div className="access-denied">Доступ запрещён</div>;

  return (
    <div className="courses-page">
      <div className="courses-container">
        <div className="courses-header">
          <h1 className="courses-title">Пользователи</h1>
          <p className="courses-subtitle">Управление пользователями системы</p>
          <button onClick={openCreateModal} className="btn-create">
            + Добавить пользователя
          </button>
        </div>
        
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Имя</th>
                <th>Email</th>
                <th>Роль</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.fullName}</td>
                  <td>{u.email}</td>
                  <td>{getRoleString(u.role)}</td>
                  <td>
                    <button onClick={() => openEditModal(u)} className="btn-edit">✏️</button>
                    {(isAdmin || (isModerator && getRoleString(u.role) !== 'ADMIN' && getRoleString(u.role) !== 'MODERATOR')) && (
                      <button onClick={() => handleDeleteUser(u.id, getRoleString(u.role))} className="btn-delete">
                        🗑️
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Модальное окно */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingUser ? 'Редактировать пользователя' : 'Добавить пользователя'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError && <div className="form-error">{formError}</div>}
                
                <div className="form-group">
                  <label>Имя и фамилия</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={!!editingUser}
                  />
                </div>
                
                {!editingUser && (
                  <div className="form-group">
                    <label>Пароль</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                )}
                
                <div className="form-group">
                  <label>Роль</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    disabled={isModerator && !!editingUser}
                  >
                    <option value="STUDENT">Студент</option>
                    <option value="TEACHER">Учитель</option>
                    {isAdmin && <option value="MODERATOR">Модератор</option>}
                    {isAdmin && <option value="ADMIN">Администратор</option>}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" disabled={submitting} className="btn-save">
                  {submitting ? 'Сохранение...' : (editingUser ? 'Обновить' : 'Создать')}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}