'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';

const TERMS = `1. 대여 기간: 신청 시 지정한 기간 내 반납
2. 파손 시: 수리 또는 동등 물품으로 배상
3. 반납 장소: 대여한 교회로 반납
4. 신분 확인: 대여 시 신분증 확인
5. 담당자 승인 후 대여 가능`;

export default function ItemApplyPage() {
  const { id } = useParams();
  const router = useRouter();
  const [form, setForm] = useState({
    quantity: 1, startDate: '', endDate: '', contactPhone: '', purpose: ''
  });
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAgreed) { alert('약관에 동의해주세요.'); return; }
    setLoading(true);
    try {
      await api.post(`/items/${id}/rentals`, { ...form, termsAgreed });
      alert('신청이 완료되었습니다. 담당자 확인 후 연락드릴게요.');
      router.push('/items');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
      alert(msg ?? '신청 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f6f8] py-10 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-[#003478] mb-6">물품 대여 신청</h1>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#EDEFF1] p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">수량</label>
            <input required type="number" min="1" value={form.quantity}
              onChange={e => setForm(p => ({ ...p, quantity: Number(e.target.value) }))}
              className="w-full px-4 py-2.5 border border-[#EDEFF1] rounded-lg text-sm focus:outline-none focus:border-[#003478]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">대여 시작일</label>
              <input required type="date" value={form.startDate}
                onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                className="w-full px-4 py-2.5 border border-[#EDEFF1] rounded-lg text-sm focus:outline-none focus:border-[#003478]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">반납 예정일</label>
              <input required type="date" value={form.endDate}
                onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                className="w-full px-4 py-2.5 border border-[#EDEFF1] rounded-lg text-sm focus:outline-none focus:border-[#003478]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">연락처 *</label>
            <input required value={form.contactPhone}
              onChange={e => setForm(p => ({ ...p, contactPhone: e.target.value }))}
              className="w-full px-4 py-2.5 border border-[#EDEFF1] rounded-lg text-sm focus:outline-none focus:border-[#003478]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">사용 목적</label>
            <textarea value={form.purpose} rows={2}
              onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))}
              className="w-full px-4 py-2.5 border border-[#EDEFF1] rounded-lg text-sm focus:outline-none focus:border-[#003478] resize-none" />
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600 whitespace-pre-line border border-[#EDEFF1]">
            {TERMS}
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={termsAgreed} onChange={e => setTermsAgreed(e.target.checked)}
              className="w-4 h-4 accent-[#003478]" />
            <span className="text-sm text-gray-700">위 약관에 동의합니다</span>
          </label>
          <button type="submit" disabled={loading || !termsAgreed}
            className="w-full py-3 bg-[#003478] text-white rounded-lg font-medium hover:bg-blue-900 transition-colors disabled:opacity-50">
            {loading ? '신청 중...' : '신청하기'}
          </button>
        </form>
      </div>
    </main>
  );
}
