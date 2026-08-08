'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Church } from '@/types';

export default function ChurchesPage() {
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [youthOnly, setYouthOnly] = useState(false);

  useEffect(() => {
    api.get('/churches')
      .then(r => setChurches(r.data.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = churches.filter(c => {
    const matchSearch = !search || c.name.includes(search) || c.address.includes(search);
    const matchYouth = !youthOnly || c.hasYouthGroup;
    return matchSearch && matchYouth;
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">불러오는 중...</div>;

  return (
    <main className="min-h-screen bg-[#f4f6f8] py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[#003478] mb-2">함께하는 교회 ⛪</h1>
        <p className="text-gray-600 mb-4">염리동 교동협의회 소속 교회들을 소개합니다.</p>

        <div className="flex gap-2 mb-6">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="교회 이름, 주소 검색..."
            className="flex-1 px-4 py-2 border border-[#EDEFF1] rounded-lg text-sm focus:outline-none focus:border-[#003478]" />
          <button onClick={() => setYouthOnly(v => !v)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${youthOnly ? 'bg-[#003478] text-white' : 'bg-white border border-[#EDEFF1] text-gray-600'}`}>
            청년부 있음
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">검색 결과가 없습니다.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map(church => (
              <Link key={church.id} href={`/churches/${church.id}`}
                className="bg-white rounded-2xl border border-[#EDEFF1] hover:border-[#003478] hover:shadow-sm transition-all block">
                {church.imageUrl ? (
                  <img src={church.imageUrl} alt={church.name}
                    className="w-full h-40 object-cover rounded-t-2xl" />
                ) : (
                  <div className="w-full h-24 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-4xl rounded-t-2xl">⛪</div>
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h2 className="text-lg font-bold text-gray-800">{church.name}</h2>
                    {church.hasYouthGroup && (
                      <span className="px-2 py-0.5 bg-blue-50 text-[#003478] text-xs rounded-full shrink-0 ml-2">청년부</span>
                    )}
                  </div>
                  {church.introduction && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{church.introduction}</p>
                  )}
                  <div className="space-y-1.5 text-xs text-gray-500">
                    <div>📍 {church.address}</div>
                    {church.sundayServiceTime && <div>🕐 주일예배 {church.sundayServiceTime}</div>}
                    {church.contactInfo && <div>📞 {church.contactInfo}</div>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
