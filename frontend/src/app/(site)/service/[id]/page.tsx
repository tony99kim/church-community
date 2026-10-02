'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { sanitizeHtml } from '@/lib/sanitize';
import { useAuthStore } from '@/store/authStore';
import type { Event } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const STATUS_LABEL: Record<string, string> = {
  UPCOMING: '모집 중',
  ONGOING: '진행 중',
  ENDED: '봉사 종료',
  CANCELLED: '취소됨',
};

const STATUS_COLOR: Record<string, string> = {
  UPCOMING: 'bg-green-50 text-green-700 border-green-200',
  ONGOING: 'bg-blue-50 text-blue-600 border-blue-200',
  ENDED: 'bg-gray-100 text-gray-400 border-gray-200',
  CANCELLED: 'bg-red-50 text-red-400 border-red-200',
};

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isLoggedIn, hydrated } = useAuthStore();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState('');

  const fetchEvent = () =>
    api.get(`/events/${id}`)
      .then(r => setEvent(r.data.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));

  useEffect(() => { fetchEvent(); }, [id]);

  const handleJoin = async () => {
    if (!hydrated) return;
    if (!isLoggedIn) { router.push('/login'); return; }
    setActionLoading(true);
    try {
      if (event?.joined) {
        await api.delete(`/events/${id}/join`);
        setToast('참여 신청이 취소되었습니다.');
      } else {
        await api.post(`/events/${id}/join`);
        setToast('봉사 신청이 완료되었습니다! 🎉');
      }
      setLoading(true);
      await fetchEvent();
      setTimeout(() => setToast(''), 2500);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setToast(e.response?.data?.message || '처리에 실패했습니다.');
      setTimeout(() => setToast(''), 2500);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <main className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-2xl mx-auto animate-pulse space-y-4">
        <div className="h-5 bg-accent rounded w-24" />
        <div className="h-56 bg-accent rounded-2xl" />
        <div className="h-6 bg-accent rounded w-2/3" />
      </div>
    </main>
  );

  if (notFound || !event) return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">🤝</div>
        <p className="text-muted-foreground mb-4">봉사 정보를 찾을 수 없습니다.</p>
        <button onClick={() => router.back()} className="text-sm text-primary hover:underline">← 돌아가기</button>
      </div>
    </main>
  );

  const canJoin = event.status === 'UPCOMING' || event.status === 'ONGOING';
  const isFull = event.maxParticipants !== null && event.currentParticipants >= event.maxParticipants && !event.joined;

  return (
    <main className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-5 py-2.5 rounded-full shadow-lg">
            {toast}
          </div>
        )}
        <button onClick={() => router.push('/service')} className="text-sm text-muted-foreground hover:text-primary mb-6 flex items-center gap-1 transition">
          ← 봉사 목록
        </button>

        <Card className="overflow-hidden">
          {event.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.thumbnailUrl} alt={event.title} className="w-full h-56 object-cover" />
          ) : (
            <div className="w-full h-36 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-6xl">🤝</div>
          )}

          <CardContent className="p-6">
            <div className="mb-3">
              <Badge className={`${STATUS_COLOR[event.status] ?? ''} border text-xs`}>
                {STATUS_LABEL[event.status] ?? event.status}
              </Badge>
            </div>
            <h1 className="text-xl font-extrabold text-gray-900 mb-5">{event.title}</h1>

            <div className="space-y-2 mb-6">
              {[
                { icon: '📍', label: '장소', value: event.location },
                { icon: '📅', label: '일정', value: `${new Date(event.startDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}${event.startDate.slice(0, 10) !== event.endDate.slice(0, 10) ? ` ~ ${new Date(event.endDate).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}` : ''}` },
              ].map(row => (
                <div key={row.label} className="flex items-start gap-3 p-3 bg-accent rounded-xl text-sm">
                  <span className="text-lg shrink-0">{row.icon}</span>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">{row.label}</div>
                    <div className="text-gray-800">{row.value}</div>
                  </div>
                </div>
              ))}
              {event.maxParticipants !== null && (
                <div className="flex items-start gap-3 p-3 bg-accent rounded-xl text-sm">
                  <span className="text-lg shrink-0">👥</span>
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground font-medium">신청 현황</div>
                    <div className="text-gray-800 flex items-center gap-2">
                      {event.currentParticipants} / {event.maxParticipants}명
                      {isFull && <span className="text-xs text-red-400 font-semibold">마감</span>}
                    </div>
                    <div className="w-full bg-white rounded-full h-1.5 mt-1.5">
                      <div className="bg-primary h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.round(event.currentParticipants / event.maxParticipants * 100))}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {event.description && (
              <div className="border-t border-border pt-5 mb-6">
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(event.description) }} />
              </div>
            )}

            {canJoin && (
              <div className="flex justify-center">
                <button onClick={handleJoin} disabled={actionLoading || (isFull && !event.joined)}
                  className={`px-10 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${
                    event.joined
                      ? 'border-2 border-red-400 bg-red-50 text-red-500 hover:bg-red-100'
                      : isFull
                      ? 'border-2 border-border bg-accent text-muted-foreground cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 hover:-translate-y-0.5'
                  }`}>
                  {actionLoading ? '처리 중...' : event.joined ? '참여 취소' : isFull ? '정원 마감' : '봉사 신청하기'}
                </button>
              </div>
            )}

            {!canJoin && event.status === 'ENDED' && (
              <div className="text-center py-4 text-sm text-muted-foreground">이미 종료된 봉사입니다.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
