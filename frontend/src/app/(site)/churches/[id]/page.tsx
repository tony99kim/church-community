'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Church } from '@/types';

export default function ChurchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [church, setChurch] = useState<Church | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get(`/churches/${id}`)
      .then(r => setChurch(r.data.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">불러오는 중...</div>;
  if (notFound || !church) {
    return (
      <main className="min-h-screen bg-[#f4f6f8] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">교회 정보를 찾을 수 없습니다.</p>
          <button onClick={() => router.back()} className="text-sm text-[#003478] hover:underline">← 돌아가기</button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f6f8] py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600 mb-6 flex items-center gap-1">
          ← 교회 목록
        </button>

        <div className="bg-white rounded-2xl border border-[#EDEFF1] overflow-hidden">
          {church.imageUrl && (
            <img src={church.imageUrl} alt={church.name} className="w-full h-56 object-cover" />
          )}
          <div className="p-6">
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{church.name}</h1>
              {church.hasYouthGroup && (
                <span className="px-2.5 py-1 bg-blue-50 text-[#003478] text-sm rounded-full shrink-0 ml-3">청년부 있음</span>
              )}
            </div>

            {church.introduction && (
              <p className="text-gray-600 mb-6 leading-relaxed">{church.introduction}</p>
            )}

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-lg shrink-0">📍</span>
                <div>
                  <div className="text-xs text-gray-400 font-medium mb-0.5">주소</div>
                  <div className="text-gray-800">{church.address}</div>
                </div>
              </div>
              {church.sundayServiceTime && (
                <div className="flex items-start gap-3">
                  <span className="text-lg shrink-0">🕐</span>
                  <div>
                    <div className="text-xs text-gray-400 font-medium mb-0.5">주일예배</div>
                    <div className="text-gray-800">{church.sundayServiceTime}</div>
                  </div>
                </div>
              )}
              {church.contactInfo && (
                <div className="flex items-start gap-3">
                  <span className="text-lg shrink-0">📞</span>
                  <div>
                    <div className="text-xs text-gray-400 font-medium mb-0.5">연락처</div>
                    <div className="text-gray-800">{church.contactInfo}</div>
                  </div>
                </div>
              )}
            </div>

            {(church.websiteUrl || church.instagramUrl) && (
              <div className="flex gap-2 mt-6 pt-5 border-t border-[#EDEFF1]">
                {church.websiteUrl && (
                  <a href={church.websiteUrl} target="_blank" rel="noopener noreferrer"
                    className="flex-1 text-center text-sm px-4 py-2.5 border border-[#EDEFF1] rounded-xl hover:border-[#003478] hover:text-[#003478] transition-colors font-medium">
                    🌐 홈페이지
                  </a>
                )}
                {church.instagramUrl && (
                  <a href={church.instagramUrl} target="_blank" rel="noopener noreferrer"
                    className="flex-1 text-center text-sm px-4 py-2.5 border border-[#EDEFF1] rounded-xl hover:border-[#003478] hover:text-[#003478] transition-colors font-medium">
                    📷 인스타그램
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
