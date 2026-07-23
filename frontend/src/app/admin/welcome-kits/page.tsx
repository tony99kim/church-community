'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { WelcomeKit } from '@/types';

export default function AdminWelcomeKitsPage() {
  const [kits, setKits] = useState<WelcomeKit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchKits = () => {
    api.get('/admin/welcome/kits').then(r => setKits(r.data.data ?? [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchKits(); }, []);

  const markProcessed = async (id: number) => {
    await api.put(`/admin/welcome/kits/${id}/process`);
    fetchKits();
  };

  if (loading) return <div className="p-6 text-gray-400">불러오는 중...</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-6">웰컴 키트 신청 관리</h1>
      <div className="space-y-3">
        {kits.map(kit => (
          <div key={kit.id} className={`bg-white border rounded-xl p-4 ${kit.processed ? 'border-[#EDEFF1] opacity-60' : 'border-amber-200'}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium text-sm">{kit.name} · {kit.phone}</div>
                {kit.address && <div className="text-xs text-gray-400 mt-0.5">📍 {kit.address}</div>}
                {kit.message && <div className="text-xs text-gray-500 mt-1">"{kit.message}"</div>}
                <div className="text-xs text-gray-400 mt-1">{new Date(kit.createdAt).toLocaleDateString()}</div>
              </div>
              <span className={`text-xs font-medium ${kit.processed ? 'text-green-600' : 'text-amber-500'}`}>
                {kit.processed ? '처리 완료' : '미처리'}
              </span>
            </div>
            {!kit.processed && (
              <button onClick={() => markProcessed(kit.id)}
                className="mt-3 px-3 py-1.5 bg-[#003478] text-white rounded-lg text-xs font-medium hover:bg-blue-900 transition-colors">
                처리 완료 표시
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
