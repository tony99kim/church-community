'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { SpaceRental } from '@/types';

const STATUS_LABEL: Record<string, string> = { PENDING: '대기중', APPROVED: '승인', REJECTED: '거절', CANCELLED: '취소' };
const STATUS_COLOR: Record<string, string> = { PENDING: 'text-amber-500', APPROVED: 'text-green-600', REJECTED: 'text-red-500', CANCELLED: 'text-gray-400' };

export default function AdminSpacesPage() {
  const [rentals, setRentals] = useState<SpaceRental[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRentals = () => {
    api.get('/admin/spaces/rentals').then(r => setRentals(r.data.data ?? [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchRentals(); }, []);

  const approve = async (id: number) => {
    await api.put(`/admin/spaces/rentals/${id}/approve`);
    fetchRentals();
  };

  const reject = async (id: number) => {
    const reason = prompt('거절 사유를 입력하세요');
    if (reason === null) return;
    await api.put(`/admin/spaces/rentals/${id}/reject`, { reason });
    fetchRentals();
  };

  if (loading) return <div className="p-6 text-gray-400">불러오는 중...</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-6">공간 대여 신청 관리</h1>
      <div className="space-y-3">
        {rentals.map(r => (
          <div key={r.id} className="bg-white border border-[#EDEFF1] rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium text-sm">{r.spaceName}</div>
                <div className="text-xs text-gray-400 mt-0.5">{r.applicantNickname} · {r.contactPhone}</div>
                <div className="text-xs text-gray-500 mt-1">목적: {r.purpose}</div>
                <div className="text-xs text-gray-500">{r.startDateTime} ~ {r.endDateTime}</div>
              </div>
              <span className={`text-xs font-medium ${STATUS_COLOR[r.status]}`}>{STATUS_LABEL[r.status]}</span>
            </div>
            {r.status === 'PENDING' && (
              <div className="flex gap-2 mt-3">
                <button onClick={() => approve(r.id)} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600">승인</button>
                <button onClick={() => reject(r.id)} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600">거절</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
