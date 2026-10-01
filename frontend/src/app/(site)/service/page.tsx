'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import type { Event, PageResponse } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const STATUS_LABEL: Record<string, string> = {
  UPCOMING: '모집 중',
  ONGOING: '진행 중',
  ENDED: '종료',
  CANCELLED: '취소',
};

const STATUS_COLOR: Record<string, string> = {
  UPCOMING: 'bg-green-50 text-green-700 border-green-200',
  ONGOING: 'bg-blue-50 text-blue-600 border-blue-200',
  ENDED: 'bg-gray-100 text-gray-400 border-gray-200',
  CANCELLED: 'bg-red-50 text-red-400 border-red-200',
};

export default function ServicePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOnly, setActiveOnly] = useState(false);

  useEffect(() => {
    api.get('/events', { params: { category: 'SERVICE', size: 20, sort: 'startDate,asc' } })
      .then(r => {
        const data: PageResponse<Event> = r.data.data;
        setEvents(data.content);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeOnly ? events.filter(e => e.status === 'UPCOMING' || e.status === 'ONGOING') : events;

  return (
    <main className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">지역 섬김 🤝</h1>
            <p className="text-muted-foreground text-sm mt-1">염리동에서 함께 섬기는 봉사 기회들을 모아뒀어요.</p>
          </div>
          <button onClick={() => setActiveOnly(v => !v)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              activeOnly ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-white border border-border text-gray-600 hover:border-primary'
            }`}>
            모집 중만 보기
          </button>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
                <div className="h-40 bg-accent" />
                <CardContent className="p-5 space-y-2">
                  <div className="h-4 bg-accent rounded w-2/3" />
                  <div className="h-3 bg-accent rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="py-20 text-center">
            <div className="text-4xl mb-3">🤝</div>
            <p className="font-semibold text-gray-700 mb-1">현재 모집 중인 봉사가 없어요.</p>
            <p className="text-sm text-muted-foreground mb-5">봉사 소식은 커뮤니티 게시판에서도 확인할 수 있어요.</p>
            <Link href="/community" className="inline-block text-sm text-primary border border-primary/30 px-4 py-2 rounded-xl hover:bg-primary/5 transition">
              커뮤니티 게시판 보기 →
            </Link>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map(event => (
              <Link key={event.id} href={`/service/${event.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer h-full">
                  {event.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={event.thumbnailUrl} alt={event.title} className="w-full h-44 object-cover" />
                  ) : (
                    <div className="w-full h-28 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-4xl">🤝</div>
                  )}
                  <CardContent className="p-5">
                    <div className="mb-2">
                      <Badge className={`${STATUS_COLOR[event.status] ?? ''} border text-xs`}>
                        {STATUS_LABEL[event.status] ?? event.status}
                      </Badge>
                    </div>
                    <h2 className="font-bold text-gray-900 mb-2 line-clamp-2">{event.title}</h2>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div>📍 {event.location}</div>
                      <div>📅 {new Date(event.startDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}</div>
                      {event.maxParticipants !== null && (
                        <div className="flex items-center gap-1">
                          <span>👥</span>
                          <span>{event.currentParticipants} / {event.maxParticipants}명 신청</span>
                          {event.currentParticipants >= event.maxParticipants && (
                            <Badge className="bg-red-50 text-red-400 border-red-200 border text-[10px] ml-1">마감</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
