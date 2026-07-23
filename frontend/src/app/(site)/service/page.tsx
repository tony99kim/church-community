'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Event } from '@/types';

export default function ServicePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/events?category=SERVICE&size=20')
      .then(r => setEvents(r.data.data?.content ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">불러오는 중...</div>;

  return (
    <main className="min-h-screen bg-[#f4f6f8] py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[#003478] mb-2">지역 섬김 🤝</h1>
        <p className="text-gray-600 mb-8">염리동에서 함께 섬기는 봉사 기회들을 모아뒀어요.</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
          {['복지관 연계 봉사', '청년주택 환대', '독거 어르신 도시락',
            '환경 정화', '여름성경학교 지원', '지역 축제 스태프'].map(label => (
            <div key={label} className="p-3 bg-white border border-[#EDEFF1] rounded-xl text-sm text-gray-600 text-center">
              {label}
            </div>
          ))}
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="mb-4">현재 모집 중인 봉사가 없어요.</p>
            <Link href="/community" className="text-[#003478] underline text-sm">
              커뮤니티 게시판 보기 →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map(event => (
              <Link key={event.id} href={`/events/${event.id}`}
                className="block bg-white rounded-xl border border-[#EDEFF1] p-4 hover:border-[#003478] transition-colors">
                <div className="font-semibold text-gray-800">{event.title}</div>
                <div className="text-xs text-gray-400 mt-1">{new Date(event.startDate).toLocaleDateString()}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
