'use client';

import { useEffect } from 'react';
import api, { clearTokens } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

function AuthRehydrator() {
  const { isLoggedIn, setUser, setHydrated } = useAuthStore();

  useEffect(() => {
    if (isLoggedIn) { setHydrated(); return; }
    const token = localStorage.getItem('accessToken') ?? sessionStorage.getItem('accessToken');
    if (!token) { setHydrated(); return; }
    api.get('/users/me')
      .then((res) => setUser(res.data.data))
      .catch(() => clearTokens())
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
