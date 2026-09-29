'use client';

import { useEffect } from 'react';
import api from '@/lib/api';
import { useAuthStore, loadSessionUser } from '@/store/authStore';

function AuthRehydrator() {
  const { setUser, setHydrated, clearAuth } = useAuthStore();

  useEffect(() => {
    const cached = loadSessionUser();
    if (cached) {
      setUser(cached);
      setHydrated(); // 캐시 있으면 즉시 UI 표시
    }

    // 백그라운드 서버 검증 (401이면 인터셉터가 refresh 시도 → 실패시 /login 이동)
    api.get('/users/me')
      .then((res) => setUser(res.data.data))
      .catch(() => { clearAuth(); }) // API 호출 없이 로컬 상태만 초기화
      .finally(() => setHydrated());
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
