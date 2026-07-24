'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { sanitizeHtml } from '@/lib/sanitize';
import { useAuthStore } from '@/store/authStore';
import type { Event } from '@/types';

const STATUS_LABEL: Record<string, string> = {
  UPCOMING: '모집 중',
  ONGOING: '진행 중',
  ENDED: '봉사 종료',
  CANCELLED: '취소됨',
};

const STATUS_COLOR: Record<string, string> = {
  UPCOMING: 'bg-green-50 text-green-700 border-green-100',
  ONGOING: 'bg-blue-50 text-blue-600 border-blue-100',
  ENDED: 'bg-gray-100 text-gray-400 border-gray-200',
  CANCELLED: 'bg-red-50 text-red-400 border-red-100',
};

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchEvent = () =>
    api.get(`/events/${id}`)
      .then(r => setEvent(r.data.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));

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
      setLoading(true);
      await fetchEvent();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || '처리에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <main className="min-h-screen bg-[#f4f6f8] py-10 px-4">
      <div className="max-w-2xl mx-auto animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-24 mb-6" />
        <div className="bg-white rounded-2xl overflow-hidden">
          <div className="h-56 bg-gray-100" />
          <div className="p-6 space-y-3">
            <div className="h-6 bg-gray-100 rounded w-2/3" />
            <div className="h-4 bg-gray-50 rounded w-1/2" />
          </div>
        </div>
      </div>
    </main>
  );

  if (notFound || !event) return (
    <main className="min-h-screen bg-[#f4f6f8] flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-400 mb-4">봉사 정보를 찾을 수 없습니다.</p>
        <button onClick={() => router.back()} className="text-sm text-[#003478] hover:underline">← 돌아가기</button>
      </div>
    </main>
  );

  const canJoin = event.status === 'UPCOMING' || event.status === 'ONGOING';
  const isFull = event.maxParticipants !== null && event.currentParticipants >= event.maxParticipants && !event.joined;

  return (
    <main className="min-h-screen bg-[#f4f6f8] py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.push('/service')} className="text-sm text-gray-400 hover:text-gray-600 mb-6 flex items-center gap-1">
          ← 봉사 목록
        </button>

        <div className="bg-white rounded-2xl border border-[#EDEFF1] overflow-hidden">
          {event.thumbnailUrl ? (
            <img src={event.thumbnailUrl} alt={event.title} className="w-full h-56 object-cover" />
          ) : (
            <div className="w-full h-32 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-5xl">
              🤝
            </div>
          )}

          <div className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-xs px-2.5 py-1 rounded border font-semibold ${STATUS_COLOR[event.status] ?? ''}`}>
                {STATUS_LABEL[event.status] ?? event.status}
              </span>
            </div>

            <h1 className="text-xl font-bold text-gray-900 mb-5">{event.title}</h1>

            <div className="space-y-3 text-sm mb-6">
              <div className="flex items-start gap-3">
                <span className="text-lg shrink-0">📍</span>
                <div>
                  <div className="text-xs text-gray-400 font-medium mb-0.5">장소</div>
                  <div className="text-gray-800">{event.location}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg shrink-0">📅</span>
                <div>
                  <div className="text-xs text-gray-400 font-medium mb-0.5">일정</div>
                  <div className="text-gray-800">
                    {new Date(event.startDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
                    {event.startDate.slice(0, 10) !== event.endDate.slice(0, 10) && (
                      <> ~ {new Date(event.endDate).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}</>
                    )}
                  </div>
                </div>
              </div>
              {event.maxParticipants !== null && (
                <div className="flex items-start gap-3">
                  <span className="text-lg shrink-0">👥</span>
                  <div>
                    <div className="text-xs text-gray-400 font-medium mb-0.5">신청 현황</div>
                    <div className="text-gray-800">
                      {event.currentParticipants} / {event.maxParticipants}명
                      {isFull && <span className="ml-2 text-xs text-red-400 font-semibold">마감</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {event.description && (
              <div className="border-t border-[#EDEFF1] pt-5 mb-6">
                <div
                  className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(event.description) }}
                />
              </div>
            )}

            {canJoin && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={handleJoin}
                  disabled={actionLoading || (isFull && !event.joined)}
                  className={`px-10 py-3 rounded-full text-sm font-bold border-2 transition disabled:opacity-50 ${
                    event.joined
                      ? 'border-red-400 bg-red-50 text-red-500 hover:bg-red-100'
                      : isFull
                      ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'border-[#003478] bg-[#003478] text-white hover:bg-[#002560]'
                  }`}
                >
                  {actionLoading ? '처리 중...' : event.joined ? '참여 취소' : isFull ? '정원 마감' : '봉사 신청하기'}
                </button>
              </div>
            )}

            {!canJoin && event.status === 'ENDED' && (
              <div className="text-center py-4 text-sm text-gray-400">이미 종료된 봉사입니다.</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
