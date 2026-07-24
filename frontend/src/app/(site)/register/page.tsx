'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

function ConditionRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs ${ok ? 'text-green-600' : 'text-red-400'}`}>
      <span className="font-bold">{ok ? '✓' : '✗'}</span>
      <span>{label}</span>
    </div>
  );
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export default function RegisterPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', name: '', nickname: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'ok' | 'dup'>('idle');
  const [nicknameStatus, setNicknameStatus] = useState<'idle' | 'checking' | 'ok' | 'dup'>('idle');
  const [showPwConditions, setShowPwConditions] = useState(false);

  useEffect(() => {
    if (isLoggedIn) router.replace('/');
  }, [isLoggedIn]);

  const pw = form.password;
  const pwConditions = {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /\d/.test(pw),
    special: /[@$!%*?&]/.test(pw),
  };
  const pwAllOk = Object.values(pwConditions).every(Boolean);
  const pwMatch = form.confirmPassword.length > 0 && form.password === form.confirmPassword;
  const pwMismatch = form.confirmPassword.length > 0 && form.password !== form.confirmPassword;

  const checkEmail = useCallback(async (email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailStatus('idle'); return; }
    setEmailStatus('checking');
    try {
      const res = await api.get(`/auth/check-email?email=${encodeURIComponent(email)}`);
      setEmailStatus(res.data.data === true ? 'ok' : 'dup');
    } catch { setEmailStatus('idle'); }
  }, []);

  const checkNickname = useCallback(async (nickname: string) => {
    if (!nickname || nickname.length < 2) { setNicknameStatus('idle'); return; }
    setNicknameStatus('checking');
    try {
      const res = await api.get(`/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`);
      setNicknameStatus(res.data.data === true ? 'ok' : 'dup');
    } catch { setNicknameStatus('idle'); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => checkEmail(form.email), 600);
    return () => clearTimeout(timer);
  }, [form.email, checkEmail]);

  useEffect(() => {
    const timer = setTimeout(() => checkNickname(form.nickname), 600);
    return () => clearTimeout(timer);
  }, [form.nickname, checkNickname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwAllOk) { setError('비밀번호 조건을 모두 충족해주세요.'); return; }
    if (pwMismatch) { setError('비밀번호가 일치하지 않습니다.'); return; }
    if (emailStatus === 'dup') { setError('이미 사용 중인 이메일입니다.'); return; }
    if (nicknameStatus === 'dup') { setError('이미 사용 중인 닉네임입니다.'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register', {
        email: form.email,
        password: form.password,
        name: form.name,
        nickname: form.nickname,
        phone: form.phone,
      });
      router.push('/login?registered=1');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || '회원가입에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = !loading && emailStatus !== 'dup' && nicknameStatus !== 'dup' && pwAllOk && !pwMismatch;

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
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => { setForm({ ...form, password: e.target.value }); setShowPwConditions(true); }}
                  onFocus={() => setShowPwConditions(true)}
                  placeholder="비밀번호를 입력하세요"
                  className={`w-full border rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478] transition ${
                    pw && pwAllOk ? 'border-green-400' : pw && showPwConditions ? 'border-orange-300' : 'border-gray-300'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  tabIndex={-1}
                >
                  <EyeIcon open={showPw} />
                </button>
              </div>
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

            {/* 비밀번호 확인 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">비밀번호 확인 <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="비밀번호를 다시 입력하세요"
                  className={`w-full border rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478] transition ${
                    pwMatch ? 'border-green-400' : pwMismatch ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  tabIndex={-1}
                >
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
              {pwMatch && <p className="text-xs text-green-600 mt-1">✓ 비밀번호가 일치합니다.</p>}
              {pwMismatch && <p className="text-xs text-red-500 mt-1">✗ 비밀번호가 일치하지 않습니다.</p>}
            </div>

            {/* 이름 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">이름 <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="실명을 입력하세요"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478] transition"
                required
              />
              <p className="text-xs text-gray-400 mt-1">행사 참여 명단 등 관리 목적으로만 사용됩니다.</p>
            </div>

            {/* 닉네임 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">닉네임 <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.nickname}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                placeholder="커뮤니티에서 사용할 이름"
                className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478] transition ${
                  nicknameStatus === 'dup' ? 'border-red-400 bg-red-50' : nicknameStatus === 'ok' ? 'border-green-400' : 'border-gray-300'
                }`}
                required
              />
              {nicknameStatus === 'checking' && <p className="text-xs text-gray-400 mt-1">확인 중...</p>}
              {nicknameStatus === 'ok' && <p className="text-xs text-green-600 mt-1">✓ 사용 가능한 닉네임입니다.</p>}
              {nicknameStatus === 'dup' && <p className="text-xs text-red-500 mt-1">✗ 이미 사용 중인 닉네임입니다.</p>}
              <p className="text-xs text-gray-400 mt-1">게시글, 댓글 등 모든 활동에 닉네임으로 표시됩니다.</p>
            </div>

            {/* 전화번호 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">전화번호 <span className="text-red-500">*</span></label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })}
                placeholder="010-0000-0000"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478] transition"
                maxLength={13}
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
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
