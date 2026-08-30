'use client';

import { useEffect } from 'react';
import api from '@/lib/api';
import { useAuthStore, loadSessionUser } from '@/store/authStore';

function AuthRehydrator() {
  const { setUser, setHydrated, logout } = useAuthStore();

  useEffect(() => {
    const cached = loadSessionUser();
    if (cached) {
      setUser(cached);
      setHydrated(); // 캐시 있으면 즉시 UI 표시
    }

    // 백그라운드 서버 검증
    api.get('/users/me')
      .then((res) => setUser(res.data.data))
      .catch(() => { if (cached) logout(); })
      .finally(() => setHydrated()); // 캐시 없는 경우 API 완료 후 hydrated
  }, []);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthRehydrator />
      {children}
    </>
  );
}
