'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api, { saveTokens } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

function OAuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();

  useEffect(() => {
    const accessToken  = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const error        = searchParams.get('error');

    if (error || !accessToken || !refreshToken) {
      router.replace('/login?error=oauth_failed');
      return;
    }

    saveTokens(accessToken, refreshToken, true);

    api.get('/users/me')
      .then(res => {
        const { id, email, nickname, role, profileImageUrl } = res.data.data;
        setUser({ id, email, nickname, role, profileImageUrl });
        router.replace('/');
      })
      .catch(() => {
        router.replace('/login?error=oauth_failed');
      });
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
    <Suspense>
      <OAuthCallback />
    </Suspense>
  );
}
