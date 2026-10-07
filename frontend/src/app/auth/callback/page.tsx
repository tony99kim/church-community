'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

function OAuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();

  useEffect(() => {
    // 백엔드가 넘긴 일회용 코드를 같은 도메인 API로 교환해 인증 쿠키를 받음
    const code = searchParams.get('code');
    const exchange = code ? api.post('/auth/oauth/exchange', { code }) : Promise.reject(new Error('no code'));
    exchange
      .then(() => api.get('/users/me'))
      .then(res => {
        const { id, email, nickname, role, profileImageUrl, provider } = res.data.data;
        setUser({ id, email, nickname, role, profileImageUrl, provider });
        router.replace('/');
      })
      .catch(() => {
        router.replace('/login?error=oauth_failed');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f6f8]">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-[#003478] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm">로그인 중...</p>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f4f6f8]">
        <div className="w-10 h-10 border-4 border-[#003478] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <OAuthCallback />
    </Suspense>
  );
}
