'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Space, SpaceRental, Church } from '@/types';
import { useAuthStore } from '@/store/authStore';

const STATUS_LABEL: Record<string, string> = { PENDING: '대기중', APPROVED: '승인', REJECTED: '거절', CANCELLED: '취소' };
const STATUS_COLOR: Record<string, string> = { PENDING: 'text-amber-500', APPROVED: 'text-green-600', REJECTED: 'text-red-500', CANCELLED: 'text-gray-400' };

const EMPTY_FORM = { churchId: '', name: '', description: '', usageTypes: '', capacity: '', available: true };

export default function AdminSpacesPage() {
  const { user: me } = useAuthStore();
  const [tab, setTab] = useState<'spaces' | 'rentals'>('spaces');
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [rentals, setRentals] = useState<SpaceRental[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [loading, setLoading] = useState(true);

  const fetchAll = () => {
    Promise.all([
      api.get('/admin/spaces').then(r => setSpaces(r.data.data ?? [])),
      api.get('/admin/spaces/rentals').then(r => setRentals(r.data.data ?? [])),
      api.get('/churches').then(r => setChurches(r.data.data ?? [])),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => { setEditId(null); setForm({ ...EMPTY_FORM }); setShowForm(true); };
  const openEdit = (s: Space) => {
    setEditId(s.id);
    setForm({
      churchId: s.churchId?.toString() ?? '',
      name: s.name,
      description: s.description ?? '',
      usageTypes: s.usageTypes ?? '',
      capacity: s.capacity?.toString() ?? '',
      available: s.available,
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const body: Record<string, unknown> = {
      name: form.name,
      description: form.description || null,
      usageTypes: form.usageTypes || null,
      capacity: form.capacity ? Number(form.capacity) : null,
      available: form.available,
    };
    if (me?.role !== 'CHURCH_MANAGER') {
      body.churchId = form.churchId ? Number(form.churchId) : null;
    }
    if (editId) {
      await api.put(`/admin/spaces/${editId}`, body);
    } else {
      await api.post('/admin/spaces', body);
    }
    setShowForm(false);
    fetchAll();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('이 공간을 삭제하시겠어요?')) return;
    await api.delete(`/admin/spaces/${id}`);
    fetchAll();
  };

  const approve = async (id: number) => { await api.put(`/admin/spaces/rentals/${id}/approve`); fetchAll(); };
  const reject = async (id: number) => {
    const reason = prompt('거절 사유를 입력하세요');
    if (reason === null) return;
    await api.put(`/admin/spaces/rentals/${id}/reject`, { reason });
    fetchAll();
  };

  if (loading) return <div className="p-6 text-gray-400">불러오는 중...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">공간 관리</h1>
        {tab === 'spaces' && (
          <button onClick={openCreate} className="bg-[#003478] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-900">
            + 공간 추가
          </button>
        )}
      </div>

      {/* 탭 */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {(['spaces', 'rentals'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${tab === t ? 'bg-white text-[#003478] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'spaces' ? `공간 목록 (${spaces.length})` : `신청 관리 (${rentals.filter(r => r.status === 'PENDING').length})`}
          </button>
        ))}
      </div>

      {/* 공간 목록 탭 */}
      {tab === 'spaces' && (
        <div className="space-y-2">
          {spaces.length === 0 ? (
            <div className="bg-white border border-[#EDEFF1] rounded-xl py-16 text-center text-gray-400 text-sm">
              등록된 공간이 없습니다. 공간을 추가해주세요.
            </div>
          ) : spaces.map(s => (
            <div key={s.id} className="bg-white border border-[#EDEFF1] rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{s.name}</span>
                  {!s.available && <span className="text-xs px-2 py-0.5 bg-red-50 text-red-500 rounded-full">대여 불가</span>}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {s.churchName ?? '교회 미지정'} {s.capacity ? `· 최대 ${s.capacity}명` : ''} {s.usageTypes ? `· ${s.usageTypes}` : ''}
                </div>
                {s.description && <div className="text-xs text-gray-500 mt-1">{s.description}</div>}
              </div>
              <div className="flex gap-2 shrink-0 ml-4">
                <button onClick={() => openEdit(s)} className="text-xs text-[#003478] hover:underline">수정</button>
                <button onClick={() => handleDelete(s.id)} className="text-xs text-red-500 hover:underline">삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 신청 관리 탭 */}
      {tab === 'rentals' && (
        <div className="space-y-3">
          {rentals.length === 0 ? (
            <div className="bg-white border border-[#EDEFF1] rounded-xl py-16 text-center text-gray-400 text-sm">신청 내역이 없습니다.</div>
          ) : rentals.map(r => (
            <div key={r.id} className="bg-white border border-[#EDEFF1] rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-sm">{r.spaceName}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{r.applicantNickname} · {r.contactPhone}</div>
                  <div className="text-xs text-gray-500 mt-1">목적: {r.purpose}</div>
                  <div className="text-xs text-gray-500">{r.startDateTime} ~ {r.endDateTime}</div>
                </div>
                <span className={`text-xs font-medium ${STATUS_COLOR[r.status]}`}>{STATUS_LABEL[r.status]}</span>
              </div>
              {r.status === 'PENDING' && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => approve(r.id)} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600">승인</button>
                  <button onClick={() => reject(r.id)} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600">거절</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 공간 등록/수정 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="font-bold text-gray-900 mb-4">{editId ? '공간 수정' : '공간 추가'}</h2>
            <form onSubmit={handleSave} className="space-y-3">
              {me?.role !== 'CHURCH_MANAGER' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">교회 *</label>
                  <select
                    required={me?.role !== 'CHURCH_MANAGER'}
                    value={form.churchId}
                    onChange={e => setForm(p => ({ ...p, churchId: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]"
                  >
                    <option value="">교회 선택</option>
                    {churches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">공간명 *</label>
                <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]" placeholder="예: 1층 강당" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">설명</label>
                <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]" placeholder="예: 프로젝터, 테이블 8개 구비" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">사용 용도</label>
                <input value={form.usageTypes} onChange={e => setForm(p => ({ ...p, usageTypes: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]" placeholder="예: 모임, 세미나, 예배" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">최대 수용 인원</label>
                <input type="number" min="1" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]" />
              </div>
              {editId && (
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.available} onChange={e => setForm(p => ({ ...p, available: e.target.checked }))} className="accent-[#003478]" />
                  대여 가능
                </label>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-xl hover:bg-gray-50">취소</button>
                <button type="submit" className="px-4 py-2 text-sm bg-[#003478] text-white rounded-xl font-semibold hover:bg-blue-900">저장</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
