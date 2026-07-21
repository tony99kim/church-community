'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function RegisterPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '', nickname: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn) router.replace('/');
  }, [isLoggedIn]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const body: Record<string, string> = { email: form.email, password: form.password, nickname: form.nickname };
      if (form.phone) body.phone = form.phone;
      await api.post('/auth/register', body);
      router.push('/login?registered=1');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || '회원가입에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f6f8] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center mb-2">
            <div className="w-10 h-10 bg-[#003478] rounded-xl flex items-center justify-center">
              <span className="text-white text-lg font-bold">C</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">ChurchHub 회원가입</h1>
          <p className="text-gray-500 text-sm mt-1">지역 청년 커뮤니티에 함께해요</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">이메일 <span className="text-red-500">*</span></label>
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
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">비밀번호 <span className="text-red-500">*</span></label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="비밀번호를 입력하세요"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478] focus:border-transparent transition"
                required
              />
              <p className="text-xs text-gray-400 mt-1">8자 이상, 영문·숫자·특수문자를 포함해주세요</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">닉네임 <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.nickname}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                placeholder="커뮤니티에서 사용할 이름"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478] focus:border-transparent transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">전화번호 <span className="text-gray-400 font-normal">(선택)</span></label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="010-0000-0000"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478] focus:border-transparent transition"
              />
            </div>
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
              {loading ? '처리 중...' : '회원가입'}
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-500">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-[#003478] font-semibold hover:underline">로그인</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
