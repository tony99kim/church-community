'use client';

import { useEffect } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

function AuthRehydrator() {
  const { isLoggedIn, setUser, setHydrated } = useAuthStore();

  useEffect(() => {
    if (isLoggedIn) { setHydrated(); return; }
    api.get('/users/me')
      .then((res) => setUser(res.data.data))
      .catch(() => {})
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
