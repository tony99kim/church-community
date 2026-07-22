'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api, { saveTokens } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, setUser } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const registered = searchParams.get('registered');

  useEffect(() => {
    if (isLoggedIn) router.replace('/');
  }, [isLoggedIn]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', form);
      const { accessToken, refreshToken, userId, email, nickname, role, profileImageUrl } = res.data.data;
      saveTokens(accessToken, refreshToken, remember);
      setUser({ id: userId, email, nickname, role, profileImageUrl });
      router.push('/');
    } catch {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f6f8] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center mb-2">
            <div className="w-10 h-10 bg-[#003478] rounded-xl flex items-center justify-center">
              <span className="text-white text-lg font-bold">C</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">ChurchHub 로그인</h1>
          <p className="text-gray-500 text-sm mt-1">지역 청년 커뮤니티에 오신 것을 환영합니다</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {registered && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mb-5 text-center">
              🎉 회원가입이 완료되었습니다! 로그인해주세요.
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">이메일</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="example@email.com"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478] focus:border-transparent transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">비밀번호</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="비밀번호를 입력하세요"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478] focus:border-transparent transition"
                required
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#003478] accent-[#003478]"
              />
              <span className="text-sm text-gray-600">로그인 유지</span>
            </label>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#003478] text-white py-3 rounded-xl text-sm font-semibold hover:bg-blue-900 disabled:opacity-50 transition"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-500">
            아직 회원이 아니신가요?{' '}
            <Link href="/register" className="text-[#003478] font-semibold hover:underline">회원가입</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
