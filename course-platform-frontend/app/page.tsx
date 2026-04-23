'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading">Загрузка...</div>;

  // ADMIN и STUDENT и GUEST (неавторизованные) видят главную страницу
  // TEACHER и MODERATOR перенаправляются на курсы
  if (user && (user.role === 'TEACHER' || user.role === 'MODERATOR')) {
    if (typeof window !== 'undefined') {
      window.location.href = '/courses';
    }
    return <div className="loading-redirect">Перенаправление...</div>;
  }

  // Все остальные (ADMIN, STUDENT, GUEST) видят главную
  return (
    <div className="home-page">
      {/* Hero секция */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="hero-badge-icon">🎸</span>
              <span>Онлайн-школа гитары</span>
            </div>
            <h1 className="hero-title">
              Научись играть на гитаре 
              <span className="hero-title-gradient"> с нуля до первых песен</span>
            </h1>
            <p className="hero-description">
              Интерактивные уроки, понятная теория и практика. 
              Играй то, что нравится, уже через 2 недели!
            </p>
            <div className="hero-buttons">
              {!user ? (
                <>
                  <Link href="/register" className="btn-primary btn-large">
                    Начать обучение
                    <span className="btn-arrow">→</span>
                  </Link>
                  <Link href="/courses" className="btn-secondary btn-large">
                    Смотреть курсы
                  </Link>
                </>
              ) : (
                <Link href="/my-courses" className="btn-primary btn-large">
                  Продолжить обучение
                  <span className="btn-arrow">→</span>
                </Link>
              )}
            </div>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">500+</span>
                <span className="stat-label">учеников</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">24/7</span>
                <span className="stat-label">доступ</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">⭐ 4.9</span>
                <span className="stat-label">оценка</span>
              </div>
            </div>
          </div>
          <div className="hero-image">
            <div className="hero-image-placeholder">
              <span className="hero-image-icon">🎸</span>
            </div>
          </div>
        </div>
      </section>

      {/* Преимущества */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Почему выбирают нас?</h2>
            <p className="section-subtitle">Всё, что нужно для комфортного обучения</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📚</div>
              <h3 className="feature-title">Структурированные курсы</h3>
              <p className="feature-description">От простого к сложному. Каждый урок — новый навык.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3 className="feature-title">Практические задания</h3>
              <p className="feature-description">Закрепляй теорию на практике с домашними заданиями.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👨‍🏫</div>
              <h3 className="feature-title">Обратная связь</h3>
              <p className="feature-description">Преподаватели проверяют работы и дают советы.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3 className="feature-title">Учись где угодно</h3>
              <p className="feature-description">Доступ с компьютера, планшета или телефона.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Как проходит обучение */}
      <section className="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Как проходит обучение?</h2>
            <p className="section-subtitle">4 простых шага к твоей первой песне</p>
          </div>
          <div className="steps-grid">
            <div className="step-item">
              <div className="step-number">01</div>
              <h3 className="step-title">Выбери курс</h3>
              <p className="step-description">Подбери программу под свой уровень</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-item">
              <div className="step-number">02</div>
              <h3 className="step-title">Смотри уроки</h3>
              <p className="step-description">Изучай теорию и смотри примеры</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-item">
              <div className="step-number">03</div>
              <h3 className="step-title">Выполняй ДЗ</h3>
              <p className="step-description">Закрепляй материал на практике</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-item">
              <div className="step-number">04</div>
              <h3 className="step-title">Получи фидбек</h3>
              <p className="step-description">Преподаватель проверит и поможет</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA секция */}
      <section className="cta-section">
        <div className="cta-container">
          <h2 className="cta-title">Готов начать своё музыкальное путешествие?</h2>
          <p className="cta-description">
            Присоединяйся к сообществу гитаристов и играй то, что любишь
          </p>
          {!user ? (
            <Link href="/register" className="btn-primary btn-large btn-cta">
              Записаться сейчас
              <span className="btn-arrow">→</span>
            </Link>
          ) : (
            <Link href="/my-courses" className="btn-primary btn-large btn-cta">
              Перейти к курсам
              <span className="btn-arrow">→</span>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}