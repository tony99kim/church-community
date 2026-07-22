'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import type { Event } from '@/types';
import { uploadImage } from '@/lib/supabase';

const RichEditor = dynamic(() => import('@/components/RichEditor'), { ssr: false });

const STATUS_LABEL: Record<string, string> = {
  UPCOMING: '예정', ONGOING: '진행 중', ENDED: '종료', CANCELLED: '취소',
};

const EMPTY_FORM = {
  title: '', description: '', location: '',
  startDate: '', endDate: '', maxParticipants: '', thumbnailUrl: '',
};

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [thumbUploading, setThumbUploading] = useState(false);
  const thumbRef = useRef<HTMLInputElement>(null);

  const fetchEvents = () =>
    api.get('/events', { params: { page: 0, size: 50 } })
      .then((r) => setEvents(r.data.data.content))
      .finally(() => setLoading(false));

  useEffect(() => { fetchEvents(); }, []);

  const handleThumb = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbUploading(true);
    try {
      const url = await uploadImage(file);
      setForm((f) => ({ ...f, thumbnailUrl: url }));
    } catch {
      alert('썸네일 업로드에 실패했습니다.');
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
    });
    setShowForm(true);
  };

  const handleSave = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSaving(true);
    try {
      const body = {
        ...form,
        maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : null,
      };
      if (editId) {
        await api.put(`/admin/events/${editId}`, body);
      } else {
        await api.post('/admin/events', body);
      }
      setShowForm(false);
      fetchEvents();
    } catch {
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('행사를 삭제(취소)하시겠어요?')) return;
    await api.delete(`/admin/events/${id}`);
    fetchEvents();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">행사 관리</h1>
        <button onClick={openCreate} className="bg-[#003478] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-900 transition">
          + 행사 등록
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="font-bold text-gray-900 mb-4">{editId ? '행사 수정' : '행사 등록'}</h2>
            <form onSubmit={handleSave} className="space-y-3">
              {([
                { key: 'title', label: '제목', type: 'text', required: true },
                { key: 'location', label: '장소', type: 'text', required: true },
                { key: 'startDate', label: '시작일시', type: 'datetime-local', required: true },
                { key: 'endDate', label: '종료일시', type: 'datetime-local', required: true },
                { key: 'maxParticipants', label: '최대 인원 (빈칸=무제한)', type: 'number', required: false },
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
              {/* 썸네일 */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">썸네일 이미지</label>
                <div className="flex items-center gap-3">
                  {form.thumbnailUrl && (
                    <div className="relative w-20 h-14 rounded-lg overflow-hidden border border-gray-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form.thumbnailUrl} alt="썸네일" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, thumbnailUrl: '' }))}
                        className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/50 text-white rounded-full text-[10px] flex items-center justify-center"
                      >×</button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => thumbRef.current?.click()}
                    disabled={thumbUploading}
                    className="text-xs text-gray-500 border border-dashed border-gray-300 rounded-lg px-3 py-2 hover:border-[#003478] hover:text-[#003478] transition disabled:opacity-50"
                  >
                    {thumbUploading ? '업로드 중...' : '+ 이미지 선택'}
                  </button>
                  <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={handleThumb} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">내용</label>
                <div className="border border-gray-300 rounded-xl overflow-hidden">
                  <RichEditor
                    content={form.description}
                    onChange={(html) => setForm((f) => ({ ...f, description: html }))}
                    placeholder="행사 내용을 입력하세요..."
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-xl hover:bg-gray-50">
                  취소
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-[#003478] text-white rounded-xl font-semibold hover:bg-blue-900 disabled:opacity-50">
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center text-gray-400">
          등록된 행사가 없습니다.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">제목</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">장소</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">일정</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">상태</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">인원</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {events.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{e.title}</td>
                  <td className="px-4 py-3 text-gray-500">{e.location}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(e.startDate).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{STATUS_LABEL[e.status]}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {e.currentParticipants}{e.maxParticipants ? `/${e.maxParticipants}` : ''}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(e)} className="text-xs text-[#003478] hover:underline">수정</button>
                      <button onClick={() => handleDelete(e.id)} className="text-xs text-red-500 hover:underline">삭제</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
