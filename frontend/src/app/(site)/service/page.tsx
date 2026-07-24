'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import type { Event, PageResponse } from '@/types';

const STATUS_LABEL: Record<string, string> = {
  UPCOMING: '모집 중',
  ONGOING: '진행 중',
  ENDED: '종료',
  CANCELLED: '취소',
};

const STATUS_COLOR: Record<string, string> = {
  UPCOMING: 'bg-green-50 text-green-700 border-green-100',
  ONGOING: 'bg-blue-50 text-blue-600 border-blue-100',
  ENDED: 'bg-gray-100 text-gray-400 border-gray-200',
  CANCELLED: 'bg-red-50 text-red-400 border-red-100',
};

export default function ServicePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/events', { params: { category: 'SERVICE', size: 20, sort: 'startDate,asc' } })
      .then(r => {
        const data: PageResponse<Event> = r.data.data;
        setEvents(data.content);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-[#f4f6f8] py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[#003478] mb-2">지역 섬김 🤝</h1>
        <p className="text-gray-600 mb-8">염리동에서 함께 섬기는 봉사 기회들을 모아뒀어요. 참여 신청하고 이웃과 함께해요.</p>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#EDEFF1] overflow-hidden animate-pulse">
                <div className="h-40 bg-gray-100" />
                <div className="p-5 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-2/3" />
                  <div className="h-3 bg-gray-50 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#EDEFF1] py-20 text-center">
            <div className="text-4xl mb-3">🤝</div>
            <p className="text-gray-500 font-medium mb-1">현재 모집 중인 봉사가 없어요.</p>
            <p className="text-sm text-gray-400 mb-5">봉사 소식은 커뮤니티 게시판에서도 확인할 수 있어요.</p>
            <Link href="/community" className="inline-block text-sm text-[#003478] border border-blue-200 px-4 py-2 rounded-xl hover:bg-blue-50 transition">
              커뮤니티 게시판 보기 →
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {events.map(event => (
              <Link
                key={event.id}
                href={`/service/${event.id}`}
                className="bg-white rounded-2xl border border-[#EDEFF1] overflow-hidden hover:border-[#003478] hover:shadow-sm transition-all block"
              >
                {event.thumbnailUrl ? (
                  <img src={event.thumbnailUrl} alt={event.title} className="w-full h-44 object-cover" />
                ) : (
                  <div className="w-full h-24 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-3xl">
                    🤝
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded border font-medium ${STATUS_COLOR[event.status] ?? ''}`}>
                      {STATUS_LABEL[event.status] ?? event.status}
                    </span>
                  </div>
                  <h2 className="font-bold text-gray-900 mb-2 line-clamp-2">{event.title}</h2>
                  <div className="space-y-1 text-xs text-gray-500">
                    <div>📍 {event.location}</div>
                    <div>📅 {new Date(event.startDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}</div>
                    {event.maxParticipants !== null && (
                      <div className="flex items-center gap-1">
                        <span>👥</span>
                        <span>{event.currentParticipants} / {event.maxParticipants}명 신청</span>
                        {event.currentParticipants >= event.maxParticipants && (
                          <span className="bg-red-50 text-red-400 text-[10px] px-1.5 py-0.5 rounded ml-1">마감</span>
                        )}
                      </div>
                    )}
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
