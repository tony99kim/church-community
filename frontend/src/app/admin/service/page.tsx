'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import type { Event } from '@/types';
import { uploadImage } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/Toast';

const RichEditor = dynamic(() => import('@/components/RichEditor'), { ssr: false });

const STATUS_LABEL: Record<string, string> = {
  DRAFT: '임시저장', UPCOMING: '모집 중', ONGOING: '진행 중', ENDED: '종료', CANCELLED: '취소',
};

const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-500',
  UPCOMING: 'bg-green-50 text-green-600',
  ONGOING: 'bg-blue-50 text-blue-600',
  ENDED: 'bg-gray-100 text-gray-400',
  CANCELLED: 'bg-red-50 text-red-400',
};

const EMPTY_FORM = {
  title: '', description: '', location: '',
  startDate: '', endDate: '', maxParticipants: '', thumbnailUrl: '',
  status: 'DRAFT', category: 'SERVICE', churchId: '',
};

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
  const headers = ['닉네임', '이메일', '전화번호', '신청일시', '봉사명'];
  const rows = data.map((p) => [
    p.nickname,
    p.email,
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
  a.download = `지역섬김_참여자_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminServicePage() {
  const { user: me } = useAuthStore();
  const [tab, setTab] = useState<'services' | 'participants'>('services');
  const [events, setEvents] = useState<Event[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [churches, setChurches] = useState<{ id: number; name: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [loading, setLoading] = useState(true);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [thumbUploading, setThumbUploading] = useState(false);
  const thumbRef = useRef<HTMLInputElement>(null);

  const fetchEvents = () =>
    api.get('/admin/events', { params: { page: 0, size: 50 } })
      .then((r) => setEvents((r.data.data.content as (Event & { category?: string })[]).filter(e => e.category === 'SERVICE')))
      .finally(() => setLoading(false));

  useEffect(() => {
    fetchEvents();
    if (me?.role === 'SUPER_ADMIN') {
      api.get('/churches').then(r => setChurches(r.data.data ?? []));
    }
  }, []);

  useEffect(() => {
    if (tab !== 'participants' || participants.length > 0) return;
    setParticipantsLoading(true);
    api.get('/admin/participants')
      .then(r => {
        const all: Participant[] = r.data.data ?? [];
        const serviceIds = new Set(events.map(e => e.id));
        setParticipants(all.filter(p => serviceIds.has(p.eventId)));
      })
      .finally(() => setParticipantsLoading(false));
  }, [tab, events]);

  const handleThumb = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbUploading(true);
    try {
      const url = await uploadImage(file);
      setForm((f) => ({ ...f, thumbnailUrl: url }));
    } catch {
      toast('이미지 업로드에 실패했습니다', 'error');
    } finally {
      setThumbUploading(false);
      e.target.value = '';
    }
  };

  const openCreate = () => { setEditId(null); setForm({ ...EMPTY_FORM }); setShowForm(true); };
  const openEdit = (e: Event) => {
    setEditId(e.id);
    setForm({
      title: e.title,
      description: e.description,
      location: e.location,
      startDate: e.startDate.slice(0, 16),
      endDate: e.endDate.slice(0, 16),
      maxParticipants: e.maxParticipants?.toString() ?? '',
      thumbnailUrl: e.thumbnailUrl ?? '',
      status: e.status,
      category: 'SERVICE',
      churchId: (e as unknown as { churchId?: number }).churchId?.toString() ?? '',
    });
    setShowForm(true);
  };

  const handlePublish = async (id: number) => {
    try {
      await api.patch(`/admin/events/${id}/status`, { status: 'UPCOMING' });
      fetchEvents();
      toast('공개되었습니다');
    } catch { toast('공개에 실패했습니다', 'error'); }
  };

  const handleSave = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSaving(true);
    try {
      const body = {
        ...form,
        category: 'SERVICE',
        maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : null,
        churchId: form.churchId ? Number(form.churchId) : null,
      };
      if (editId) {
        await api.put(`/admin/events/${editId}`, body);
      } else {
        await api.post('/admin/events', body);
      }
      setShowForm(false);
      fetchEvents();
      toast(editId ? '수정되었습니다' : '봉사 활동이 등록되었습니다');
    } catch {
      toast('저장에 실패했습니다', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('봉사 활동을 삭제(취소)하시겠어요?')) return;
    try {
      await api.delete(`/admin/events/${id}`);
      fetchEvents();
      toast('삭제되었습니다');
    } catch { toast('삭제에 실패했습니다', 'error'); }
  };

  const filteredParticipants = selectedEvent === 'all'
    ? participants
    : participants.filter(p => String(p.eventId) === selectedEvent);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">지역섬김 관리</h1>
          <p className="text-sm text-gray-500 mt-1">지역섬김 봉사 활동을 등록하고 모집을 관리합니다</p>
        </div>
        {tab === 'services' && (
          <button onClick={openCreate} className="bg-[#003478] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-900 transition">
            + 봉사 등록
          </button>
        )}
        {tab === 'participants' && filteredParticipants.length > 0 && (
          <button onClick={() => downloadCSV(filteredParticipants)}
            className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition">
            CSV 다운로드
          </button>
        )}
      </div>

      {/* 탭 */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {(['services', 'participants'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${tab === t ? 'bg-white text-[#003478] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'services' ? `봉사 목록 (${events.length})` : `참여자`}
          </button>
        ))}
      </div>

      {/* 봉사 등록/수정 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="font-bold text-gray-900 mb-4">{editId ? '봉사 수정' : '봉사 등록'}</h2>
            <form onSubmit={handleSave} className="space-y-3">
              {([
                { key: 'title', label: '봉사명', type: 'text', required: true },
                { key: 'location', label: '장소', type: 'text', required: true },
                { key: 'startDate', label: '시작일시', type: 'datetime-local', required: true },
                { key: 'endDate', label: '종료일시', type: 'datetime-local', required: true },
                { key: 'maxParticipants', label: '모집 인원 (빈칸=무제한)', type: 'number', required: false },
              ] as { key: keyof typeof EMPTY_FORM; label: string; type: string; required: boolean }[]).map(({ key, label, type, required }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]"
                    required={required}
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">대표 이미지</label>
                <div className="flex items-center gap-3">
                  {form.thumbnailUrl && (
                    <div className="relative w-20 h-14 rounded-lg overflow-hidden border border-gray-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form.thumbnailUrl} alt="썸네일" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setForm((f) => ({ ...f, thumbnailUrl: '' }))}
                        className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/50 text-white rounded-full text-[10px] flex items-center justify-center">×</button>
                    </div>
                  )}
                  <button type="button" onClick={() => thumbRef.current?.click()} disabled={thumbUploading}
                    className="text-xs text-gray-500 border border-dashed border-gray-300 rounded-lg px-3 py-2 hover:border-[#003478] hover:text-[#003478] transition disabled:opacity-50">
                    {thumbUploading ? '업로드 중...' : '+ 이미지 선택'}
                  </button>
                  <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={handleThumb} />
                </div>
              </div>

              {me?.role === 'SUPER_ADMIN' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">교회 (선택)</label>
                  <select value={form.churchId} onChange={(e) => setForm((f) => ({ ...f, churchId: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]">
                    <option value="">교회 선택 안함</option>
                    {churches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">모집 상태</label>
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]">
                  <option value="DRAFT">임시저장 (비공개)</option>
                  <option value="UPCOMING">모집 중 (공개)</option>
                  <option value="ONGOING">진행 중</option>
                  <option value="ENDED">종료</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">봉사 내용</label>
                <div className="border border-gray-300 rounded-xl overflow-hidden">
                  <RichEditor content={form.description} onChange={(html) => setForm((f) => ({ ...f, description: html }))}
                    placeholder="봉사 내용과 안내사항을 입력하세요..." />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-xl hover:bg-gray-50">취소</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-[#003478] text-white rounded-xl font-semibold hover:bg-blue-900 disabled:opacity-50">
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 봉사 목록 탭 */}
      {tab === 'services' && (
        loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center text-gray-400">
            등록된 봉사 활동이 없습니다.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">봉사명</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">장소</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">일정</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">상태</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">신청 인원</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {events.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{e.title}</td>
                    <td className="px-4 py-3 text-gray-500">{e.location}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(e.startDate).toLocaleDateString('ko-KR')}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLOR[e.status]}`}>{STATUS_LABEL[e.status]}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{e.currentParticipants}{e.maxParticipants ? `/${e.maxParticipants}명` : '명'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        {e.status === 'DRAFT' && (
                          <button onClick={() => handlePublish(e.id)} className="text-xs text-green-600 hover:underline font-semibold">공개</button>
                        )}
                        <button onClick={() => openEdit(e)} className="text-xs text-[#003478] hover:underline">수정</button>
                        <button onClick={() => handleDelete(e.id)} className="text-xs text-red-500 hover:underline">삭제</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* 참여자 탭 */}
      {tab === 'participants' && (
        participantsLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <>
            <div className="mb-4">
              <select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}
                className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]">
                <option value="all">전체 봉사 ({participants.length}명)</option>
                {events.map((e) => {
                  const count = participants.filter(p => p.eventId === e.id).length;
                  return <option key={e.id} value={String(e.id)}>{e.title} ({count}명)</option>;
                })}
              </select>
            </div>

            {filteredParticipants.length === 0 ? (
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
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">봉사명</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredParticipants.map((p, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{p.nickname}</td>
                        <td className="px-4 py-3 text-gray-500">{p.email}</td>
                        <td className="px-4 py-3 text-gray-500">{p.phone ?? '-'}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{new Date(p.registeredAt).toLocaleString('ko-KR')}</td>
                        <td className="px-4 py-3 text-gray-600">{p.eventTitle}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )
      )}
    </div>
  );
}
