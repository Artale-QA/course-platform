'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: 'STUDENT' | 'TEACHER' | 'MODERATOR' | 'ADMIN';
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    api.get('/auth/me')
      .then(res => {
        const data = res.data;
        setUser({
          id: data.id,
          email: data.email,
          fullName: data.fullName,
          role: data.role,
        });
      })
      .catch(() => {
        localStorage.removeItem('token');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // ✅ Добавь эту функцию
  const login = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await api.get('/auth/me');
      const data = response.data;
      setUser({
        id: data.id,
        email: data.email,
        fullName: data.fullName,
        role: data.role,
      });
    } catch (error) {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/';
  };

  const confirmLogout = () => {
    setShowLogoutModal(true);
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  return { 
    user, 
    loading, 
    logout, 
    setUser,
    login,           // ← добавить
    confirmLogout,
    cancelLogout,
    showLogoutModal,
    setShowLogoutModal
  };
}