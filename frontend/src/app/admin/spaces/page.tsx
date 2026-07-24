'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Space, SpaceRental, Church, SpaceBlock } from '@/types';
import { useAuthStore } from '@/store/authStore';

const STATUS_LABEL: Record<string, string> = { PENDING: '대기중', APPROVED: '승인', REJECTED: '거절', CANCELLED: '취소' };
const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-600',
  APPROVED: 'bg-green-50 text-green-600',
  REJECTED: 'bg-red-50 text-red-500',
  CANCELLED: 'bg-gray-100 text-gray-400',
};

const DAY_LABELS: Record<number, string> = { 1: '월', 2: '화', 3: '수', 4: '목', 5: '금', 6: '토', 7: '일' };

const EMPTY_FORM = { churchId: '', name: '', description: '', usageTypes: '', capacity: '', available: true, imageUrl: '' };
const EMPTY_BLOCK = { reason: '', recurring: true, dayOfWeek: 7, blockDate: '', startTime: '09:00', endTime: '12:00' };

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

  // 예약 현황 필터
  const [rentalDate, setRentalDate] = useState(new Date().toISOString().slice(0, 10));
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // 거절 모달
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // 메시지 모달
  const [messageRentalId, setMessageRentalId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // 차단 관리
  const [blockSpaceId, setBlockSpaceId] = useState<number | null>(null);
  const [blocks, setBlocks] = useState<SpaceBlock[]>([]);
  const [blockForm, setBlockForm] = useState({ ...EMPTY_BLOCK });

  const fetchAll = () => {
    Promise.all([
      api.get('/admin/spaces').then(r => setSpaces(r.data.data ?? [])),
      api.get('/admin/spaces/rentals').then(r => setRentals(r.data.data ?? [])),
      api.get('/churches').then(r => setChurches(r.data.data ?? [])),
    ]).catch(() => {}).finally(() => setLoading(false));
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
      imageUrl: s.imageUrl ?? '',
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
      imageUrl: form.imageUrl || null,
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

  const openBlockManager = async (spaceId: number) => {
    setBlockSpaceId(spaceId);
    setBlockForm({ ...EMPTY_BLOCK });
    const r = await api.get(`/admin/spaces/${spaceId}/blocks`);
    setBlocks(r.data.data ?? []);
  };

  const addBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockSpaceId) return;
    const body: Record<string, unknown> = {
      reason: blockForm.reason,
      recurring: blockForm.recurring,
      startTime: blockForm.startTime,
      endTime: blockForm.endTime,
    };
    if (blockForm.recurring) {
      body.dayOfWeek = Number(blockForm.dayOfWeek);
    } else {
      body.blockDate = blockForm.blockDate;
    }
    await api.post(`/admin/spaces/${blockSpaceId}/blocks`, body);
    const r = await api.get(`/admin/spaces/${blockSpaceId}/blocks`);
    setBlocks(r.data.data ?? []);
    setBlockForm({ ...EMPTY_BLOCK });
  };

  const deleteBlock = async (blockId: number) => {
    await api.delete(`/admin/spaces/blocks/${blockId}`);
    if (blockSpaceId) {
      const r = await api.get(`/admin/spaces/${blockSpaceId}/blocks`);
      setBlocks(r.data.data ?? []);
    }
  };

  const approve = async (id: number) => { await api.put(`/admin/spaces/rentals/${id}/approve`); fetchAll(); };
  const openReject = (id: number) => { setRejectId(id); setRejectReason(''); };
  const confirmReject = async () => {
    if (rejectId === null) return;
    await api.put(`/admin/spaces/rentals/${rejectId}/reject`, { reason: rejectReason });
    setRejectId(null);
    fetchAll();
  };

  const openMessage = (r: SpaceRental) => {
    setMessageRentalId(r.id);
    setMessageInput(r.adminMessage ?? '');
  };
  const confirmMessage = async () => {
    if (messageRentalId === null) return;
    setSendingMessage(true);
    try {
      await api.put(`/admin/spaces/rentals/${messageRentalId}/message`, { adminMessage: messageInput });
      setMessageRentalId(null);
      fetchAll();
    } catch { alert('메시지 전송에 실패했습니다.'); }
    finally { setSendingMessage(false); }
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
            {t === 'spaces' ? `공간 목록 (${spaces.length})` : `예약 현황 (${rentals.filter(r => r.status === 'PENDING').length})`}
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
                <button onClick={() => openBlockManager(s.id)} className="text-xs text-orange-600 border border-orange-200 px-2 py-1 rounded-lg hover:bg-orange-50">차단 관리</button>
                <button onClick={() => openEdit(s)} className="text-xs text-[#003478] hover:underline">수정</button>
                <button onClick={() => handleDelete(s.id)} className="text-xs text-red-500 hover:underline">삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 예약 현황 탭 */}
      {tab === 'rentals' && (
        <div>
          {/* 필터 */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">날짜</label>
              <input type="date" value={rentalDate}
                onChange={e => setRentalDate(e.target.value)}
                className="border border-gray-300 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">상태</label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]">
                <option value="ALL">전체</option>
                <option value="PENDING">대기중</option>
                <option value="APPROVED">승인</option>
                <option value="REJECTED">거절</option>
                <option value="CANCELLED">취소</option>
              </select>
            </div>
          </div>

          {/* 테이블 */}
          <div className="bg-white border border-[#EDEFF1] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#f4f6f8] border-b border-[#EDEFF1]">
                <tr>
                  {['공간명','신청자','날짜/시간','인원','목적','연락처','상태','액션'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">메시지</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDEFF1]">
                {rentals
                  .filter(r => r.startDateTime.startsWith(rentalDate))
                  .filter(r => statusFilter === 'ALL' || r.status === statusFilter)
                  .map(r => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap">{r.spaceName}</td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{r.applicantNickname}</td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap text-xs">
                        {r.startDateTime.slice(0,10)}<br/>
                        {r.startDateTime.slice(11,16)} ~ {r.endDateTime.slice(11,16)}
                      </td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{r.headcount ?? '-'}</td>
                      <td className="px-3 py-2 text-gray-600 max-w-[140px] truncate">{r.purpose}</td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{r.contactPhone}</td>
                      <td className="px-3 py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[r.status]}`}>
                          {STATUS_LABEL[r.status]}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {r.status === 'PENDING' && (
                          <div className="flex gap-1">
                            <button onClick={() => approve(r.id)}
                              className="px-2 py-1 text-xs bg-[#003478] text-white rounded-lg hover:bg-blue-900 whitespace-nowrap">승인</button>
                            <button onClick={() => openReject(r.id)}
                              className="px-2 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 whitespace-nowrap">거절</button>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => openMessage(r)}
                          className="px-2 py-1 text-xs border border-blue-200 text-[#003478] rounded-lg hover:bg-blue-50 whitespace-nowrap"
                        >
                          {r.adminMessage ? '메시지 수정' : '메시지'}
                        </button>
                        {r.adminMessage && (
                          <div className="text-[10px] text-blue-600 mt-0.5 max-w-[100px] truncate" title={r.adminMessage}>
                            {r.adminMessage}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                {rentals.filter(r => r.startDateTime.startsWith(rentalDate)).filter(r => statusFilter === 'ALL' || r.status === statusFilter).length === 0 && (
                  <tr><td colSpan={9} className="py-12 text-center text-gray-400 text-sm">해당 날짜에 예약이 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 거절 모달 */}
      {rejectId !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <h2 className="font-bold text-gray-900 mb-3">거절 사유</h2>
            <textarea rows={3} value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="거절 사유를 입력하세요"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478] resize-none mb-4" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setRejectId(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-xl hover:bg-gray-50">취소</button>
              <button onClick={confirmReject} disabled={!rejectReason.trim()}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 disabled:opacity-50">거절 확인</button>
            </div>
          </div>
        </div>
      )}

      {/* 메시지 모달 */}
      {messageRentalId !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <h2 className="font-bold text-gray-900 mb-1">신청자에게 메시지</h2>
            <p className="text-xs text-gray-500 mb-3">신청자가 내정보에서 확인할 수 있습니다.</p>
            <textarea rows={4} value={messageInput}
              onChange={e => setMessageInput(e.target.value)}
              placeholder="예: 승인되었습니다. 사용 전 관리자실에 열쇠를 수령해 주세요."
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478] resize-none mb-4" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setMessageRentalId(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-xl hover:bg-gray-50">취소</button>
              <button onClick={confirmMessage} disabled={sendingMessage}
                className="px-4 py-2 text-sm bg-[#003478] text-white rounded-xl font-semibold hover:bg-blue-900 disabled:opacity-50">
                {sendingMessage ? '전송 중...' : '전송'}
              </button>
            </div>
          </div>
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
                <textarea rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478] resize-none" placeholder="예: 프로젝터, 테이블 8개 구비, 냉난방 완비" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">이미지 URL</label>
                <input value={form.imageUrl} onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]" placeholder="https://..." />
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
      {/* 차단 관리 모달 */}
      {blockSpaceId !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">시간 차단 관리</h2>
              <button onClick={() => setBlockSpaceId(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            {/* 기존 차단 목록 */}
            <div className="mb-5">
              <h3 className="text-xs font-semibold text-gray-500 mb-2">등록된 차단</h3>
              {blocks.length === 0 ? (
                <p className="text-xs text-gray-400">등록된 차단이 없습니다.</p>
              ) : (
                <ul className="space-y-2">
                  {blocks.map(b => (
                    <li key={b.id} className="flex items-center justify-between bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
                      <div>
                        <span className="text-xs font-medium text-orange-700">{b.reason}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          {b.recurring ? `매주 ${DAY_LABELS[b.dayOfWeek!]}` : b.blockDate}
                          {' '}{b.startTime.slice(0,5)} ~ {b.endTime.slice(0,5)}
                        </span>
                        <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${b.recurring ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'}`}>
                          {b.recurring ? '매주 반복' : '일회성'}
                        </span>
                      </div>
                      <button onClick={() => deleteBlock(b.id)} className="text-red-400 hover:text-red-600 text-xs ml-3 shrink-0">삭제</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 새 차단 추가 */}
            <h3 className="text-xs font-semibold text-gray-500 mb-2">새 차단 추가</h3>
            <form onSubmit={addBlock} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">사유 *</label>
                <input required value={blockForm.reason} onChange={e => setBlockForm(p => ({ ...p, reason: e.target.value }))}
                  placeholder="예: 주일 예배, 수요 예배, 청년부 모임"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]" />
              </div>
              <div className="flex gap-2">
                <label className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-sm font-medium cursor-pointer transition ${blockForm.recurring ? 'bg-[#003478] text-white border-[#003478]' : 'border-gray-300 text-gray-600'}`}>
                  <input type="radio" className="hidden" checked={blockForm.recurring} onChange={() => setBlockForm(p => ({ ...p, recurring: true }))} />
                  매주 반복
                </label>
                <label className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-sm font-medium cursor-pointer transition ${!blockForm.recurring ? 'bg-[#003478] text-white border-[#003478]' : 'border-gray-300 text-gray-600'}`}>
                  <input type="radio" className="hidden" checked={!blockForm.recurring} onChange={() => setBlockForm(p => ({ ...p, recurring: false }))} />
                  특정 날짜
                </label>
              </div>
              {blockForm.recurring ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">요일 *</label>
                  <div className="flex gap-1">
                    {([1,2,3,4,5,6,7] as const).map(d => (
                      <button key={d} type="button" onClick={() => setBlockForm(p => ({ ...p, dayOfWeek: d }))}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition ${blockForm.dayOfWeek === d ? 'bg-[#003478] text-white border-[#003478]' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                        {DAY_LABELS[d]}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">날짜 *</label>
                  <input required={!blockForm.recurring} type="date" value={blockForm.blockDate}
                    onChange={e => setBlockForm(p => ({ ...p, blockDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]" />
                </div>
              )}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">시작 시간</label>
                  <input type="time" value={blockForm.startTime}
                    onChange={e => setBlockForm(p => ({ ...p, startTime: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">종료 시간</label>
                  <input type="time" value={blockForm.endTime}
                    onChange={e => setBlockForm(p => ({ ...p, endTime: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]" />
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition">
                차단 추가
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
