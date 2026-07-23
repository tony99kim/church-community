'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';

export default function SpaceApplyPage() {
  const { id } = useParams();
  const router = useRouter();
  const [form, setForm] = useState({
    startDateTime: '', endDateTime: '', headcount: '', purpose: '', contactPhone: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/spaces/${id}/rentals`, {
        ...form,
        headcount: form.headcount ? Number(form.headcount) : null
      });
      alert('신청이 완료되었습니다. 담당자 확인 후 연락드릴게요.');
      router.push('/spaces');
    } catch {
      alert('신청 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f6f8] py-10 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-[#003478] mb-6">공간 대여 신청</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm text-amber-700">
          자동 예약이 아닙니다. 담당자가 확인 후 연락드립니다.
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#EDEFF1] p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">시작 일시</label>
            <input required type="datetime-local" value={form.startDateTime}
              onChange={e => setForm(p => ({ ...p, startDateTime: e.target.value }))}
              className="w-full px-4 py-2.5 border border-[#EDEFF1] rounded-lg text-sm focus:outline-none focus:border-[#003478]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">종료 일시</label>
            <input required type="datetime-local" value={form.endDateTime}
              onChange={e => setForm(p => ({ ...p, endDateTime: e.target.value }))}
              className="w-full px-4 py-2.5 border border-[#EDEFF1] rounded-lg text-sm focus:outline-none focus:border-[#003478]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">예상 인원</label>
            <input type="number" min="1" value={form.headcount}
              onChange={e => setForm(p => ({ ...p, headcount: e.target.value }))}
              className="w-full px-4 py-2.5 border border-[#EDEFF1] rounded-lg text-sm focus:outline-none focus:border-[#003478]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">사용 목적 *</label>
            <textarea required value={form.purpose} rows={3}
              onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))}
              className="w-full px-4 py-2.5 border border-[#EDEFF1] rounded-lg text-sm focus:outline-none focus:border-[#003478] resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">연락처 *</label>
            <input required value={form.contactPhone}
              onChange={e => setForm(p => ({ ...p, contactPhone: e.target.value }))}
              className="w-full px-4 py-2.5 border border-[#EDEFF1] rounded-lg text-sm focus:outline-none focus:border-[#003478]" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-[#003478] text-white rounded-lg font-medium hover:bg-blue-900 transition-colors disabled:opacity-50">
            {loading ? '신청 중...' : '신청하기'}
          </button>
        </form>
      </div>
    </main>
  );
}
