'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import type { Event, PageResponse } from '@/types';

const STATUS_LABEL: Record<string, string> = {
  UPCOMING: '예정',
  ONGOING: '진행 중',
  ENDED: '종료',
  CANCELLED: '취소',
};

const STATUS_COLOR: Record<string, string> = {
  UPCOMING: 'bg-blue-50 text-blue-600 border-blue-100',
  ONGOING: 'bg-green-50 text-green-600 border-green-100',
  ENDED: 'bg-gray-100 text-gray-400 border-gray-200',
  CANCELLED: 'bg-red-50 text-red-400 border-red-100',
};

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/events', { params: { page: 0, size: 20, sort: 'startDate,asc' } })
      .then((r) => {
        const data: PageResponse<Event> = r.data.data;
        setEvents(data.content);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">행사 일정</h1>
        <p className="text-sm text-gray-500 mt-1">교회 행사 일정을 확인하고 참여 신청하세요</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-[#EDEFF1] rounded-xl p-5 animate-pulse">
              <div className="h-5 bg-gray-100 rounded w-2/3 mb-2" />
              <div className="h-4 bg-gray-50 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white border border-[#EDEFF1] rounded-xl py-16 text-center">
          <div className="text-3xl mb-2">📅</div>
          <p className="text-gray-400 text-sm">예정된 행사가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="block bg-white border border-[#EDEFF1] rounded-xl overflow-hidden hover:border-[#003478] hover:shadow-sm transition"
            >
              {event.thumbnailUrl && (
                <div className="w-full h-36 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={event.thumbnailUrl} alt={event.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded border font-medium ${STATUS_COLOR[event.status]}`}>
                    {STATUS_LABEL[event.status]}
                  </span>
                  <h2 className="text-sm font-bold text-gray-900 truncate">{event.title}</h2>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                  <span>📍 {event.location}</span>
                  <span>·</span>
                  <span>📅 {new Date(event.startDate).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}</span>
                  {event.maxParticipants !== null && (
                    <>
                      <span>·</span>
                      <span>👥 {event.currentParticipants}/{event.maxParticipants}명</span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
