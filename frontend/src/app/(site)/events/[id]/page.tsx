'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { Event } from '@/types';

const STATUS_LABEL: Record<string, string> = {
  UPCOMING: '참여 신청 가능',
  ONGOING: '진행 중',
  ENDED: '행사 종료',
  CANCELLED: '행사 취소',
};

export default function EventDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchEvent = () =>
    api.get(`/events/${id}`).then((r) => setEvent(r.data.data)).finally(() => setLoading(false));

  useEffect(() => { fetchEvent(); }, [id]);

  const handleJoin = async () => {
    if (!isLoggedIn) { router.push('/login'); return; }
    setActionLoading(true);
    try {
      if (event?.joined) {
        await api.delete(`/events/${id}/join`);
      } else {
        await api.post(`/events/${id}/join`);
      }
      await fetchEvent();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || '처리에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-6 animate-pulse">
      <div className="h-8 bg-gray-100 rounded w-2/3 mb-4" />
      <div className="h-48 bg-gray-100 rounded" />
    </div>
  );
  if (!event) return (
    <div className="max-w-3xl mx-auto px-4 py-8 text-center text-gray-400">행사를 찾을 수 없습니다.</div>
  );

  const canJoin = event.status === 'UPCOMING' || event.status === 'ONGOING';
  const isFull = event.maxParticipants !== null && event.currentParticipants >= event.maxParticipants && !event.joined;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Link href="/events" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-[#003478] mb-4 transition">
        ← 행사 목록
      </Link>

      <article className="bg-white border border-[#EDEFF1] rounded-xl overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-[#EDEFF1]">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs bg-blue-50 text-[#003478] border border-blue-100 px-2.5 py-1 rounded font-bold">
              {STATUS_LABEL[event.status]}
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-4">{event.title}</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <span>📍</span><span>{event.location}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <span>👤</span><span>{event.authorNickname}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 sm:col-span-2">
              <span>🗓</span>
              <span>
                {new Date(event.startDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                {' ~ '}
                {new Date(event.endDate).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
              </span>
            </div>
            {event.maxParticipants !== null && (
              <div className="flex items-center gap-2 text-gray-600">
                <span>👥</span>
                <span>{event.currentParticipants} / {event.maxParticipants}명</span>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-6">
          <p className="text-gray-800 leading-loose whitespace-pre-wrap text-sm">{event.description}</p>
        </div>

        {canJoin && (
          <div className="px-6 pb-6 flex justify-center">
            <button
              onClick={handleJoin}
              disabled={actionLoading || (isFull && !event.joined)}
              className={`px-8 py-2.5 rounded-full text-sm font-bold border-2 transition disabled:opacity-50 ${
                event.joined
                  ? 'border-red-400 bg-red-50 text-red-500 hover:bg-red-100'
                  : isFull
                  ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                  : 'border-[#003478] bg-[#003478] text-white hover:bg-[#002560]'
              }`}
            >
              {actionLoading ? '처리 중...' : event.joined ? '참여 취소' : isFull ? '정원 초과' : '참여 신청'}
            </button>
          </div>
        )}
      </article>
    </div>
  );
}
