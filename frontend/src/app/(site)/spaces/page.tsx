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

  return (
    <main className="min-h-screen bg-[#f4f6f8] py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[#003478] mb-2">공간 대여 🏠</h1>
        <p className="text-gray-600 mb-2">교회 공간을 무료로 빌릴 수 있어요. 담당자 확인 후 최종 승인됩니다.</p>
        {!isLoggedIn && (
          <p className="text-sm text-amber-600 mb-6">※ 신청하려면 <Link href="/login" className="underline">로그인</Link>이 필요합니다.</p>
        )}

        {spaces.length === 0 ? (
          <div className="text-center py-20 text-gray-400">등록된 공간이 없습니다.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {spaces.map(space => (
              <div key={space.id} className="bg-white rounded-2xl border border-[#EDEFF1] p-5">
                <div className="flex items-start justify-between mb-2">
                  <h2 className="text-lg font-bold text-gray-800">{space.name}</h2>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${space.available ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                    {space.available ? '대여 가능' : '대여 불가'}
                  </span>
                </div>
                {space.churchName && <div className="text-xs text-gray-400 mb-2">⛪ {space.churchName}</div>}
                {space.description && <p className="text-sm text-gray-600 mb-3">{space.description}</p>}
                <div className="text-xs text-gray-500 space-y-1">
                  {space.usageTypes && <div>✅ 사용 용도: {space.usageTypes}</div>}
                  {space.capacity && <div>👥 수용 인원: {space.capacity}명</div>}
                </div>
                {isLoggedIn && space.available && (
                  <Link href={`/spaces/${space.id}`}
                    className="mt-4 block text-center py-2 bg-[#003478] text-white rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors">
                    신청하기
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
