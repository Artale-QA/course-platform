'use client';

import { useEffect, useState } from 'react';

export default function PageLoader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Скрываем загрузку после первого рендера
    const timer = setTimeout(() => setLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!loading) return null;

  return (
    <div className="page-loader">
      <div className="spinner"></div>
    </div>
  );
}