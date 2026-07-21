'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

function ConditionRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs ${ok ? 'text-green-600' : 'text-red-400'}`}>
      <span className="font-bold">{ok ? '✓' : '✗'}</span>
      <span>{label}</span>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '', nickname: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'ok' | 'dup'>('idle');
  const [showPwConditions, setShowPwConditions] = useState(false);

  useEffect(() => {
    if (isLoggedIn) router.replace('/');
  }, [isLoggedIn]);

  // 비밀번호 조건
  const pw = form.password;
  const pwConditions = {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /\d/.test(pw),
    special: /[@$!%*?&]/.test(pw),
  };
  const pwAllOk = Object.values(pwConditions).every(Boolean);

  // 이메일 중복 체크 (디바운스)
  const checkEmail = useCallback(async (email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailStatus('idle');
      return;
    }
    setEmailStatus('checking');
    try {
      const res = await api.get(`/auth/check-email?email=${encodeURIComponent(email)}`);
      setEmailStatus(res.data.data === true ? 'ok' : 'dup');
    } catch {
      setEmailStatus('idle');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => checkEmail(form.email), 600);
    return () => clearTimeout(timer);
  }, [form.email, checkEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwAllOk) { setError('비밀번호 조건을 모두 충족해주세요.'); return; }
    if (emailStatus === 'dup') { setError('이미 사용 중인 이메일입니다.'); return; }
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
            {/* 이메일 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">이메일 <span className="text-red-500">*</span></label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="example@email.com"
                className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478] transition ${
                  emailStatus === 'dup' ? 'border-red-400 bg-red-50' : emailStatus === 'ok' ? 'border-green-400' : 'border-gray-300'
                }`}
                required
              />
              {emailStatus === 'checking' && <p className="text-xs text-gray-400 mt-1">확인 중...</p>}
              {emailStatus === 'ok' && <p className="text-xs text-green-600 mt-1">✓ 사용 가능한 이메일입니다.</p>}
              {emailStatus === 'dup' && <p className="text-xs text-red-500 mt-1">✗ 이미 사용 중인 이메일입니다.</p>}
            </div>

            {/* 비밀번호 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">비밀번호 <span className="text-red-500">*</span></label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => { setForm({ ...form, password: e.target.value }); setShowPwConditions(true); }}
                onFocus={() => setShowPwConditions(true)}
                placeholder="비밀번호를 입력하세요"
                className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478] transition ${
                  pw && pwAllOk ? 'border-green-400' : pw && showPwConditions ? 'border-orange-300' : 'border-gray-300'
                }`}
                required
              />
              {showPwConditions && (
                <div className="mt-2 p-3 bg-gray-50 rounded-xl grid grid-cols-2 gap-1">
                  <ConditionRow ok={pwConditions.length} label="8자 이상" />
                  <ConditionRow ok={pwConditions.upper} label="대문자 포함" />
                  <ConditionRow ok={pwConditions.lower} label="소문자 포함" />
                  <ConditionRow ok={pwConditions.number} label="숫자 포함" />
                  <ConditionRow ok={pwConditions.special} label="특수문자(@$!%*?&)" />
                </div>
              )}
            </div>

            {/* 닉네임 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">닉네임 <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.nickname}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                placeholder="커뮤니티에서 사용할 이름"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478] transition"
                required
              />
            </div>

            {/* 전화번호 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">전화번호 <span className="text-gray-400 font-normal">(선택)</span></label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="010-0000-0000"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478] transition"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || emailStatus === 'dup' || !pwAllOk && pw.length > 0}
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