'use client';

import { useState, FormEvent } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const { setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', { email, password });
      const data = response.data;
      
      localStorage.setItem('token', data.token);
      
      setUser({
        id: data.id,
        email: data.email,
        fullName: data.fullName,
        role: data.role,
      });
      
      window.location.href = '/';
    } catch (err) {
      setError('Неверный email или пароль');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Вход</h1>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input"
            required
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            required
          />
          <button type="submit" className="login-button">
            Войти
          </button>
        </form>
      </div>
    </div>
  );
}