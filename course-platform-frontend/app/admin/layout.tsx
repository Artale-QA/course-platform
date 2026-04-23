'use client';

import { useAuth } from '@/hooks/useAuth'; // Импорт хука

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // ✅ ПРАВИЛЬНО: ВСЕ хуки вызываются здесь, в самом начале компонента
  const { user, loading } = useAuth();

  // Теперь можно использовать условия и ранние возвраты (return)
  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (!user || user.role !== 'ADMIN') {
    return <div>Доступ запрещён</div>;
  }

  // ✅ OK: основной возврат компонента
  return (
    <div className="admin-layout">
      {children}
    </div>
  );
}