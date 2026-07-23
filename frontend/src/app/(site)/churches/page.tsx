'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Church } from '@/types';

export default function ChurchesPage() {
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/churches')
      .then(r => setChurches(r.data.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">불러오는 중...</div>;

  return (
    <main className="min-h-screen bg-[#f4f6f8] py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[#003478] mb-2">함께하는 교회 ⛪</h1>
        <p className="text-gray-600 mb-8">염리동 교동협의회 소속 교회들을 소개합니다.</p>

        {churches.length === 0 ? (
          <div className="text-center py-20 text-gray-400">등록된 교회가 없습니다.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {churches.map(church => (
              <div key={church.id} className="bg-white rounded-2xl border border-[#EDEFF1] p-5 hover:border-[#003478] transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-lg font-bold text-gray-800">{church.name}</h2>
                  {church.hasYouthGroup && (
                    <span className="px-2 py-0.5 bg-blue-50 text-[#003478] text-xs rounded-full shrink-0 ml-2">청년부</span>
                  )}
                </div>
                {church.introduction && (
                  <p className="text-sm text-gray-600 mb-3">{church.introduction}</p>
                )}
                <div className="space-y-1.5 text-xs text-gray-500">
                  <div>📍 {church.address}</div>
                  {church.sundayServiceTime && <div>🕐 주일예배 {church.sundayServiceTime}</div>}
                  {church.contactInfo && <div>📞 {church.contactInfo}</div>}
                </div>
                {(church.websiteUrl || church.instagramUrl) && (
                  <div className="flex gap-2 mt-3">
                    {church.websiteUrl && (
                      <a href={church.websiteUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs px-3 py-1 border border-[#EDEFF1] rounded-full hover:border-[#003478] transition-colors">
                        홈페이지
                      </a>
                    )}
                    {church.instagramUrl && (
                      <a href={church.instagramUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs px-3 py-1 border border-[#EDEFF1] rounded-full hover:border-[#003478] transition-colors">
                        인스타그램
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
