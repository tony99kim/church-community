'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent } from '@/components/ui/card';

const TERMS = `1. 대여 기간: 신청 시 지정한 기간 내 반납
2. 파손 시: 수리 또는 동등 물품으로 배상
3. 반납 장소: 대여한 교회로 반납
4. 신분 확인: 대여 시 신분증 확인
5. 담당자 승인 후 대여 가능`;

export default function ItemApplyPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isLoggedIn, hydrated } = useAuthStore();

  useEffect(() => {
    if (!hydrated) return;
    if (!isLoggedIn) router.replace('/login');
  }, [hydrated, isLoggedIn]);

  const [form, setForm] = useState({ quantity: 1, startDate: '', endDate: '', contactPhone: '', purpose: '' });
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAgreed) { setError('약관에 동의해주세요.'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post(`/items/${id}/rentals`, { ...form, termsAgreed });
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
      setError(msg ?? '신청 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="max-w-sm w-full text-center p-8">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-extrabold text-gray-900 mb-2">신청 완료!</h2>
        <p className="text-muted-foreground text-sm mb-6">담당자 확인 후 연락드릴게요.</p>
        <Link href="/items" className="block py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition">
          목록으로 돌아가기
        </Link>
      </Card>
    </main>
  );

  return (
    <main className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-lg mx-auto">
        <Link href="/items" className="text-sm text-muted-foreground hover:text-primary mb-6 flex items-center gap-1 transition">
          ← 물품 목록
        </Link>
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900">물품 대여 신청</h1>
          <p className="text-muted-foreground text-sm mt-1">담당자 확인 후 연락드릴게요.</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">수량</label>
                <input required type="number" min="1" value={form.quantity}
                  onChange={e => setForm(p => ({ ...p, quantity: Number(e.target.value) }))}
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">대여 시작일</label>
                  <input required type="date" value={form.startDate}
                    onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">반납 예정일</label>
                  <input required type="date" value={form.endDate}
                    onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">연락처 <span className="text-red-500">*</span></label>
                <input required value={form.contactPhone}
                  onChange={e => setForm(p => ({ ...p, contactPhone: e.target.value }))}
                  placeholder="010-0000-0000"
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">사용 목적</label>
                <textarea value={form.purpose} rows={3}
                  onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))}
                  placeholder="사용 목적을 간략히 적어주세요"
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition" />
              </div>
              <div className="bg-accent rounded-xl p-4 text-xs text-muted-foreground whitespace-pre-line">
                {TERMS}
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={termsAgreed} onChange={e => setTermsAgreed(e.target.checked)}
                  className="w-4 h-4 accent-primary" />
                <span className="text-sm text-gray-700 font-medium">위 약관에 동의합니다</span>
              </label>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
              )}
              <button type="submit" disabled={loading || !termsAgreed}
                className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition shadow-md shadow-primary/20 hover:-translate-y-0.5 disabled:opacity-50">
                {loading ? '신청 중...' : '신청하기'}
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
