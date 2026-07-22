'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Event } from '@/types';

interface Participant {
  userId: number;
  email: string;
  nickname: string;
  phone: string | null;
  registeredAt: string;
  eventId: number;
  eventTitle: string;
}

function downloadCSV(data: Participant[]) {
  const headers = ['이메일', '닉네임', '전화번호', '신청일시', '신청행사'];
  const rows = data.map((p) => [
    p.email,
    p.nickname,
    p.phone ?? '-',
    new Date(p.registeredAt).toLocaleString('ko-KR'),
    p.eventTitle,
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `참여자_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/participants').then((r) => setParticipants(r.data.data)),
      api.get('/events', { params: { page: 0, size: 100 } }).then((r) => setEvents(r.data.data.content)),
    ]).finally(() => setLoading(false));
  }, []);

  const filtered =
    selectedEvent === 'all'
      ? participants
      : participants.filter((p) => String(p.eventId) === selectedEvent);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">행사 참여자</h1>
        <button
          onClick={() => downloadCSV(filtered)}
          className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition"
        >
          CSV 다운로드
        </button>
      </div>

      {/* 행사 필터 */}
      <div className="mb-4">
        <select
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
          className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]"
        >
          <option value="all">전체 행사 ({participants.length}명)</option>
          {events.map((e) => {
            const count = participants.filter((p) => p.eventId === e.id).length;
            return (
              <option key={e.id} value={String(e.id)}>
                {e.title} ({count}명)
              </option>
            );
          })}
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center text-gray-400">
          참여자가 없습니다.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">닉네임</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">이메일</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">전화번호</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">신청일시</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">신청행사</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((p, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.nickname}</td>
                  <td className="px-4 py-3 text-gray-500">{p.email}</td>
                  <td className="px-4 py-3 text-gray-500">{p.phone ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(p.registeredAt).toLocaleString('ko-KR')}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.eventTitle}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
