'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!authLoading && user && user.role !== 'MODERATOR' && user.role !== 'ADMIN') {
      router.push('/');
    }
  }, [user, authLoading, router]);

  if (authLoading) return <div className="loading-message">Загрузка...</div>;
  if (!user || (user.role !== 'MODERATOR' && user.role !== 'ADMIN')) {
    return <div className="access-denied">Доступ запрещён</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', { email, password, fullName, role });
      setSuccess(`Пользователь ${fullName} успешно зарегистрирован!`);
      setError('');
      setEmail('');
      setPassword('');
      setFullName('');
      setRole('STUDENT');
    } catch (err) {
      setError('Ошибка регистрации');
      setSuccess('');
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h1 className="register-title">Регистрация нового пользователя</h1>
        {error && <div className="error-message-register">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Полное имя"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="register-input"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="register-input"
            required
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="register-input"
            required
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="register-select"
          >
            <option value="STUDENT">Студент</option>
            <option value="TEACHER">Учитель</option>
            <option value="MODERATOR">Модератор</option>
            {user?.role === 'ADMIN' && <option value="ADMIN">Администратор</option>}
          </select>
          <button type="submit" className="register-button">
            Зарегистрировать
          </button>
        </form>
      </div>
    </div>
  );
}