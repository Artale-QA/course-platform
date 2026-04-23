'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface LessonPreview {
  id: number;
  title: string;
  orderIndex: number;
}

interface Tariff {
  id: number;
  name: string;
  title: string;
  description: string;
  price: number;
  maxLessonOrder?: number;
}

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface CoursePreview {
  id: number;
  title: string;
  shortDescription: string;
  fullDescription?: string;
}

export default function CoursePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, login } = useAuth();
  const [course, setCourse] = useState<CoursePreview | null>(null);
  const [lessons, setLessons] = useState<LessonPreview[]>([]);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [marketingPreview, setMarketingPreview] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Состояния для модального окна
  const [showModal, setShowModal] = useState(false);
  const [selectedTariff, setSelectedTariff] = useState<Tariff | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [processingTariff, setProcessingTariff] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

 useEffect(() => {
    console.log('=== DEBUG TARIFFS ===');
    console.log('hasAccess:', hasAccess);
    console.log('tariffs.length:', tariffs.length);
    console.log('tariffs:', tariffs);
  }, [hasAccess, tariffs]);

  // Функция для безопасного получения features
  const getFeatures = (): Feature[] => {
    if (!marketingPreview?.features) return [];
    if (Array.isArray(marketingPreview.features)) return marketingPreview.features;
    // Если всё же строка — парсим
    if (typeof marketingPreview.features === 'string') {
      try {
        return JSON.parse(marketingPreview.features);
      } catch (e) {
        console.error('Ошибка парсинга features:', e);
        return [];
      }
    }
    return [];
  };

  useEffect(() => {
    api.get(`/courses/${id}/full`)
      .then(res => {
        // Загружаем тарифы для этого курса
        return Promise.all([
          Promise.resolve(res),
          api.get(`/courses/${id}/tariffs`).catch(() => ({ data: [] }))
        ]);
      })
      .then(([originalRes, tariffsRes]) => {
        setCourse(originalRes.data.course);
        setLessons(originalRes.data.lessons);
        setTariffs(tariffsRes.data);
        
        const preview = originalRes.data.preview;
        if (preview && preview.features && typeof preview.features === 'string') {
          try {
            preview.features = JSON.parse(preview.features);
          } catch (e) {
            console.error('Ошибка парсинга features:', e);
            preview.features = [];
          }
        }
        setMarketingPreview(preview);
        
        setHasAccess(originalRes.data.hasAccess);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  // Открыть модальное окно для неавторизованного пользователя
  const openPaymentModal = (tariff: Tariff) => {
    setSelectedTariff(tariff);
    setEmail('');
    setPassword('');
    setFullName('');
    setError('');
    setShowModal(true);
  };

  // Покупка для авторизованного студента
  const handleBuy = async (tariffId: number, tariffName: string) => {
    if (!user || user.role !== 'STUDENT') return;
    
    setProcessingTariff(tariffId);
    setSuccessMessage('');
    
    try {
      const response = await api.post('/payment/simulate', { tariffId });
      setSuccessMessage(response.data.message);
      
      // Обновляем статус доступа
      const fullRes = await api.get(`/courses/${id}/full`);
      setHasAccess(fullRes.data.hasAccess);
      
      // ✅ ОБНОВЛЯЕМ СТРАНИЦУ
      window.location.reload();
      
    } catch (err: any) {
      alert(err.response?.data?.message || 'Ошибка при активации тарифа');
    } finally {
      setProcessingTariff(null);
    }
  };

  // Оплата + регистрация для неавторизованного пользователя
  const handlePaymentAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingPayment(true);
    setError('');

    try {
      // 1. Регистрация нового пользователя (роль STUDENT)
      const registerRes = await api.post('/auth/register', {
        email,
        password,
        fullName,
        role: 'STUDENT'
      });

      if (!registerRes.data || registerRes.data.includes('success')) {
        // 2. Вход после регистрации
        const loginRes = await api.post('/auth/login', {
          email,
          password
        });
        
        localStorage.setItem('token', loginRes.data.token);
        
        // 3. Обновляем состояние пользователя
        if (login) await login();
        
        // 4. Активация тарифа
        await api.post('/payment/simulate', { tariffId: selectedTariff?.id });
        
        // 5. Обновляем статус доступа
        const fullRes = await api.get(`/courses/${id}/full`);
        setHasAccess(fullRes.data.hasAccess);
        
        // 6. Закрываем модалку и сразу обновляем страницу
        setShowModal(false);
        window.location.reload();
      }
    } catch (err: any) {
      if (err.response?.status === 400 && err.response?.data?.includes('already exists')) {
        setError('Пользователь с таким email уже существует. Попробуйте войти.');
      } else {
        setError(err.response?.data || 'Ошибка при оплате. Попробуйте позже.');
      }
    } finally {
      setLoadingPayment(false);
    }
  };

  if (loading) {
    return <div className="loading-placeholder"/>;
  }
  if (!course) return <div className="loading">Курс не найден</div>;

  const features = getFeatures();

  return (
    <div className="courses-page">
      <div className="courses-container">
        {successMessage && (
          <div className="message-success">
            ✅ {successMessage}
          </div>
        )}

        {marketingPreview && (
          <div className="course-marketing-block">
            <div className="marketing-hero">
              {marketingPreview.heroVideoUrl ? (
                <video className="marketing-video" autoPlay muted loop>
                  <source src={marketingPreview.heroVideoUrl} type="video/mp4" />
                </video>
              ) : marketingPreview.heroImageUrl ? (
                <img src={marketingPreview.heroImageUrl} alt={marketingPreview.title} className="marketing-image" />
              ) : null}
              
              <div className="marketing-content">
                <h1 className="marketing-title">{marketingPreview.title || course.title}</h1>
                <p className="marketing-subtitle">{marketingPreview.subtitle}</p>
                <p className="marketing-description">{marketingPreview.description || course.shortDescription}</p>
              </div>
            </div>

            {features.length > 0 && (
              <div className="marketing-features">
                <h2 className="section-title">Почему выбирают нас?</h2>
                <div className="features-grid">
                  {features.map((feature: Feature, index: number) => (
                    <div key={index} className="feature-card">
                      <div className="feature-icon">{feature.icon}</div>
                      <h3 className="feature-title">{feature.title}</h3>
                      <p className="feature-description">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!hasAccess && tariffs.length > 0 && (
              <div className="marketing-tariffs">
                <h2 className="section-title">Выберите тариф</h2>
                <p className="tariffs-description">{marketingPreview.tariffDescription || "Выберите подходящий тариф"}</p>
                <div className="tariffs-grid">
                  {tariffs.map(tariff => (
                    <div key={tariff.id} className="tariff-card">
                      <div className="tariff-icon">
                        {tariff.name === 'BASIC' && '🎓'}
                        {tariff.name === 'PRO' && '⭐'}
                        {tariff.name === 'PREMIUM' && '👑'}
                      </div>
                      <h3 className="tariff-title">{tariff.title}</h3>
                      <p className="tariff-description">{tariff.description}</p>
                      <div className="tariff-price">
                        {tariff.price === 0 ? 'Бесплатно' : `${tariff.price} ₽`}
                      </div>
                      <div className="tariff-lessons">
                        📚 {tariff.maxLessonOrder || 0} уроков
                      </div>
                      
                      {user && user.role === 'STUDENT' && (
                        <button 
                          onClick={() => handleBuy(tariff.id, tariff.name)}
                          disabled={processingTariff === tariff.id}
                          className="btn-buy"
                        >
                          {processingTariff === tariff.id ? 'Активация...' : (tariff.price === 0 ? 'Активировать' : 'Купить')}
                        </button>
                      )}
                      
                      {!user && (
                        <button 
                          onClick={() => openPaymentModal(tariff)}
                          className="btn-buy"
                        >
                          {tariff.price === 0 ? 'Активировать' : 'Купить'}
                        </button>
                      )}
                      
                      {user && user.role !== 'STUDENT' && (
                        <div className="tariff-warning">🔒 Доступно только для студентов</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="courses-header">
          <h1 className="courses-title">{course.title}</h1>
          <p className="courses-subtitle">{course.shortDescription}</p>
        </div>
        
        <h2 className="lessons-title">Уроки курса</h2>
        <div className="lessons-vertical-grid">
          {lessons.map(lesson => (
            <Link 
              key={lesson.id} 
              href={hasAccess ? `/courses/${id}/lessons/${lesson.id}` : '#'}
              className={`course-link ${!hasAccess ? 'disabled' : ''}`}
              onClick={(e) => {
                if (!hasAccess) {
                  e.preventDefault();
                  const tariffsSection = document.querySelector('.marketing-tariffs');
                  if (tariffsSection) {
                    tariffsSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }
              }}
            >
              <div className="lesson-card-vertical">
                <div className="lesson-info">
                  <span className="lesson-number">Урок {lesson.orderIndex}</span>
                  <span className="lesson-name">{lesson.title}</span>
                </div>
                <div className="course-card-arrow">
                  {hasAccess ? (
                    <span className="arrow-icon">→</span>
                  ) : (
                    <span className="lock-icon">🔒</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {!hasAccess && (
          <div className="auth-warning">
            <p className="auth-warning-text">
              🔒 Полное содержание уроков доступно только после покупки тарифа.
              <button 
                onClick={() => {
                  const tariffsSection = document.querySelector('.marketing-tariffs');
                  if (tariffsSection) {
                    tariffsSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="auth-link"
              >
                Выбрать тариф
              </button>
            </p>
          </div>
        )}
      </div>

      {/* Модальное окно оплаты + регистрации */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Оплата тарифа</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {selectedTariff && (
                <div className="selected-tariff-info">
                  <p>Вы покупаете тариф: <strong>{selectedTariff.title}</strong></p>
                  <p className="tariff-price-modal">{selectedTariff.price === 0 ? 'Бесплатно' : `${selectedTariff.price} ₽`}</p>
                  <p className="tariff-hint">После оплаты вы будете зарегистрированы и получите доступ к курсу</p>
                </div>
              )}
              
              {error && (
                <div className="login-error">{error}</div>
              )}
              
              <form onSubmit={handlePaymentAndRegister}>
                <div className="form-group">
                  <label>Имя и фамилия</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Иван Иванов"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Пароль</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loadingPayment}
                  className="btn-pay"
                >
                  {loadingPayment ? 'Обработка...' : (selectedTariff?.price === 0 ? 'Активировать' : 'Оплатить')}
                </button>
              </form>
              
              <div className="modal-footer-links">
                <span>Уже есть аккаунт? </span>
                <button 
                  onClick={() => {
                    setShowModal(false);
                    router.push('/login');
                  }}
                  className="register-link"
                >
                  Войти
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}