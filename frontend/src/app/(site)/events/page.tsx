'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import type { Event, PageResponse } from '@/types';
import Pagination from '@/components/Pagination';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const STATUS_LABEL: Record<string, string> = {
  UPCOMING: '예정',
  ONGOING: '진행 중',
  ENDED: '종료',
  CANCELLED: '취소',
};

const STATUS_VARIANT: Record<string, string> = {
  UPCOMING: 'bg-blue-50 text-blue-600 border-blue-200',
  ONGOING: 'bg-green-50 text-green-600 border-green-200',
  ENDED: 'bg-gray-100 text-gray-400 border-gray-200',
  CANCELLED: 'bg-red-50 text-red-400 border-red-100',
};

const EVENT_CATEGORIES = [
  { value: '', label: '전체' },
  { value: 'NEIGHBORHOOD', label: '🏘 동네 모임' },
  { value: 'FAITH', label: '✝️ 신앙 모임' },
  { value: 'CHURCH', label: '⛪ 교회별 행사' },
  { value: 'WELCOME_TABLE', label: '🍽 웰컴 테이블' },
];

export default function EventsPage() {
  const { isLoggedIn } = useAuthStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => { setPage(0); }, [category]);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string | number> = { page, size: 12, sort: 'startDate,asc' };
    if (category) params.category = category;
    api.get('/events', { params })
      .then((r) => {
        const data: PageResponse<Event> = r.data.data;
        setEvents(data.content.filter((e: Event & { category?: string }) => e.category !== 'SERVICE'));
        setTotalPages(data.totalPages);
      })
      .finally(() => setLoading(false));
  }, [category, page]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900">행사 안내 📅</h1>
        <p className="text-sm text-muted-foreground mt-1">염리동 청년 커뮤니티 행사를 확인하고 참여 신청하세요</p>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex flex-wrap gap-2 mb-8">
        {EVENT_CATEGORIES.map(cat => (
          <button key={cat.value} onClick={() => setCategory(cat.value)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              category === cat.value
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'bg-white border border-border text-gray-600 hover:border-primary hover:text-primary'
            }`}>
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-44 bg-muted rounded-t-xl" />
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : events.length === 0 ? (
        <Card className="py-20 text-center">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-muted-foreground text-sm">예정된 행사가 없습니다.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((event) => (
            <Link key={event.id} href={`/events/${event.id}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer h-full">
                <div className="relative w-full h-44 bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden">
                  {event.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={event.thumbnailUrl} alt={event.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">📅</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span className={`text-xs px-2 py-1 rounded-full border font-semibold backdrop-blur-sm bg-white/90 ${STATUS_VARIANT[event.status]}`}>
                      {STATUS_LABEL[event.status]}
                    </span>
                    {isLoggedIn && event.joined && (
                      <span className="text-xs px-2 py-1 rounded-full font-semibold bg-green-500/90 text-white backdrop-blur-sm border-0">
                        ✓ 신청함
                      </span>
                    )}
                  </div>
                  {event.maxParticipants !== null && (
                    <div className="absolute bottom-3 right-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-black/40 text-white backdrop-blur-sm font-medium">
                        👥 {event.currentParticipants}/{event.maxParticipants}명
                      </span>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h2 className="font-bold text-sm text-gray-900 mb-2 line-clamp-2">{event.title}</h2>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">📍 {event.location}</span>
                    <span>·</span>
                    <span>{new Date(event.startDate).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8">
          <Pagination page={page} totalPages={totalPages} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
        </div>
      )}
    </div>
  );
}
