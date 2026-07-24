'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Space } from '@/types';
import { useAuthStore } from '@/store/authStore';

export default function SpacesPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const { isLoggedIn } = useAuthStore();

  useEffect(() => {
    api.get('/spaces').then(r => setSpaces(r.data.data ?? [])).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">불러오는 중...</div>;

  // 교회별 그룹화
  const grouped = spaces.reduce<Record<string, Space[]>>((acc, s) => {
    const key = s.churchName ?? '기타';
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-[#f4f6f8] py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[#003478] mb-2">공간 대여 🏠</h1>
        <p className="text-gray-500 text-sm mb-6">날짜와 시간대를 선택해 바로 예약하세요. 담당자 확인 후 최종 승인됩니다.</p>

        {!isLoggedIn && (
          <p className="text-sm text-amber-600 mb-6">※ 예약하려면 <Link href="/login" className="underline">로그인</Link>이 필요합니다.</p>
        )}

        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-20 text-gray-400">등록된 공간이 없습니다.</div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([churchName, churchSpaces]) => (
              <section key={churchName}>
                <h2 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="text-[#003478]">⛪</span> {churchName}
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {churchSpaces.map(space => (
                    <div key={space.id} className="bg-white rounded-2xl border border-[#EDEFF1] p-5">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-base font-bold text-gray-800">{space.name}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${space.available ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                          {space.available ? '예약 가능' : '예약 불가'}
                        </span>
                      </div>
                      {space.description && <p className="text-sm text-gray-500 mb-3">{space.description}</p>}
                      <div className="text-xs text-gray-400 space-y-0.5 mb-4">
                        {space.usageTypes && <div>✅ {space.usageTypes}</div>}
                        {space.capacity && <div>👥 최대 {space.capacity}명</div>}
                        {space.openTime && (
                          <div>🕐 {space.openTime.slice(0, 5)} ~ {space.closeTime?.slice(0, 5)} ({space.slotMinutes}분 단위)</div>
                        )}
                      </div>
                      {space.available && (
                        <Link href={`/spaces/${space.id}`}
                          className="block text-center py-2 bg-[#003478] text-white rounded-xl text-sm font-medium hover:bg-blue-900 transition-colors">
                          {isLoggedIn ? '날짜 선택하기' : '로그인 후 예약'}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
