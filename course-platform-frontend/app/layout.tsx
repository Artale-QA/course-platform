'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import LogoutModal from '@/app/components/LogoutModal';
import PageLoader from '@/app/components/PageLoader';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, confirmLogout, cancelLogout, showLogoutModal } = useAuth();

  return (
    <html lang="ru">
      <body>
        <PageLoader />
        <nav className="navbar">
          <div className="nav-container">
            <div className="nav-links">
              {(!user || user.role === 'ADMIN') && (
                <Link href="/" className="nav-link">Главная</Link>
              )}

              {user?.role === 'STUDENT' && (
                <Link href="/my-courses" className="nav-link">Мои курсы</Link>
              )}

              <Link href="/courses" className="nav-link">Курсы</Link>
              
              {user?.role === 'TEACHER' && (
                <Link href="/submissions" className="nav-link">Домашние задания</Link>
              )}
              
              {user?.role === 'MODERATOR' && (
                <Link href="/users" className="nav-link">Пользователи</Link>
              )}

              {user?.role === 'ADMIN' && (
                <Link href="/admin/courses" className="nav-link">🛠️ Конструктор</Link>
              )}
              
              <Link href="/tuner" className="nav-link">🎸 Тюнер</Link>

              <Link href="/chords" className="nav-link">🎸 Аккорды</Link>
              
              {user?.role === 'ADMIN' && (
                <>
                  <Link href="/my-courses" className="nav-link">Мои курсы</Link>
                  <Link href="/submissions" className="nav-link">Домашние задания</Link>
                  <Link href="/users" className="nav-link">Пользователи</Link>
                </>
              )}
            </div>
            
            <div className="nav-user">
              {user ? (
                <>
                  <span className="user-name">{user.fullName} ({user.role})</span>
                  <Link 
                    href="/" 
                    className="nav-link"
                    onClick={(e) => {
                      e.preventDefault();
                      confirmLogout();
                    }}
                  >
                    Выйти
                  </Link>
                </>
              ) : (
                <Link href="/login" className="nav-link">Вход</Link>
              )}
            </div>
          </div>
        </nav>
        <main className="main-content">
          <div className="container">
            {children}
          </div>
        </main>
        {/* Модальное окно подтверждения выхода */}
        <LogoutModal 
          isOpen={showLogoutModal}
          onConfirm={logout}
          onCancel={cancelLogout}
        />
      </body>
    </html>
  );
}