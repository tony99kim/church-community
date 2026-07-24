'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Item, ItemRental, Church, ItemCategory } from '@/types';
import { useAuthStore } from '@/store/authStore';

const STATUS_LABEL: Record<string, string> = { PENDING: '대기중', APPROVED: '승인', REJECTED: '거절', CANCELLED: '취소' };
const STATUS_COLOR: Record<string, string> = { PENDING: 'text-amber-500', APPROVED: 'text-green-600', REJECTED: 'text-red-500', CANCELLED: 'text-gray-400' };
const CATEGORY_LABEL: Record<ItemCategory, string> = { MOVING: '이사', CLEANING: '청소', LIVING: '생활', EVENT: '행사' };

const EMPTY_FORM = { churchId: '', name: '', description: '', category: 'LIVING' as ItemCategory, totalQuantity: '1' };

export default function AdminItemsPage() {
  const { user: me } = useAuthStore();
  const [tab, setTab] = useState<'items' | 'rentals'>('items');
  const [items, setItems] = useState<Item[]>([]);
  const [rentals, setRentals] = useState<ItemRental[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [loading, setLoading] = useState(true);

  const fetchAll = () => {
    Promise.all([
      api.get('/admin/items').then(r => setItems(r.data.data ?? [])),
      api.get('/admin/items/rentals').then(r => setRentals(r.data.data ?? [])),
      api.get('/churches').then(r => setChurches(r.data.data ?? [])),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => { setEditId(null); setForm({ ...EMPTY_FORM }); setShowForm(true); };
  const openEdit = (item: Item) => {
    setEditId(item.id);
    setForm({
      churchId: item.churchId?.toString() ?? '',
      name: item.name,
      description: item.description ?? '',
      category: item.category,
      totalQuantity: item.totalQuantity.toString(),
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const body: Record<string, unknown> = {
      name: form.name,
      description: form.description || null,
      category: form.category,
      totalQuantity: Number(form.totalQuantity),
    };
    if (me?.role !== 'CHURCH_MANAGER') {
      body.churchId = form.churchId ? Number(form.churchId) : null;
    }
    if (editId) {
      await api.put(`/admin/items/${editId}`, body);
    } else {
      await api.post('/admin/items', body);
    }
    setShowForm(false);
    fetchAll();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('이 물품을 삭제하시겠어요?')) return;
    await api.delete(`/admin/items/${id}`);
    fetchAll();
  };

  const approve = async (id: number) => { await api.put(`/admin/items/rentals/${id}/approve`); fetchAll(); };
  const reject = async (id: number) => {
    const reason = prompt('거절 사유를 입력하세요');
    if (reason === null) return;
    await api.put(`/admin/items/rentals/${id}/reject`, { reason });
    fetchAll();
  };

  if (loading) return <div className="p-6 text-gray-400">불러오는 중...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">물품 관리</h1>
        {tab === 'items' && (
          <button onClick={openCreate} className="bg-[#003478] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-900">
            + 물품 추가
          </button>
        )}
      </div>

      {/* 탭 */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {(['items', 'rentals'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${tab === t ? 'bg-white text-[#003478] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'items' ? `물품 목록 (${items.length})` : `신청 관리 (${rentals.filter(r => r.status === 'PENDING').length})`}
          </button>
        ))}
      </div>

      {/* 물품 목록 탭 */}
      {tab === 'items' && (
        <div className="space-y-2">
          {items.length === 0 ? (
            <div className="bg-white border border-[#EDEFF1] rounded-xl py-16 text-center text-gray-400 text-sm">
              등록된 물품이 없습니다. 물품을 추가해주세요.
            </div>
          ) : items.map(item => (
            <div key={item.id} className="bg-white border border-[#EDEFF1] rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{item.name}</span>
                  <span className="text-xs px-2 py-0.5 bg-blue-50 text-[#003478] rounded-full">{CATEGORY_LABEL[item.category]}</span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {item.churchName ?? '교회 미지정'} · 총 {item.totalQuantity}개 (대여가능 {item.availableQuantity}개)
                </div>
                {item.description && <div className="text-xs text-gray-500 mt-1">{item.description}</div>}
              </div>
              <div className="flex gap-2 shrink-0 ml-4">
                <button onClick={() => openEdit(item)} className="text-xs text-[#003478] hover:underline">수정</button>
                <button onClick={() => handleDelete(item.id)} className="text-xs text-red-500 hover:underline">삭제</button>
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
                  <div className="font-medium text-sm">{r.itemName} × {r.quantity}개</div>
                  <div className="text-xs text-gray-400 mt-0.5">{r.applicantNickname} · {r.contactPhone}</div>
                  <div className="text-xs text-gray-500 mt-1">{r.startDate} ~ {r.endDate}</div>
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

      {/* 물품 등록/수정 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="font-bold text-gray-900 mb-4">{editId ? '물품 수정' : '물품 추가'}</h2>
            <form onSubmit={handleSave} className="space-y-3">
              {me?.role !== 'CHURCH_MANAGER' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">교회</label>
                  <select
                    value={form.churchId}
                    onChange={e => setForm(p => ({ ...p, churchId: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]"
                  >
                    <option value="">교회 선택 (선택사항)</option>
                    {churches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">물품명 *</label>
                <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]" placeholder="예: 청소기" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">카테고리 *</label>
                <select required value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value as ItemCategory }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]">
                  <option value="MOVING">이사</option>
                  <option value="CLEANING">청소</option>
                  <option value="LIVING">생활</option>
                  <option value="EVENT">행사</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">설명</label>
                <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]" placeholder="예: 무선 청소기, 충전식" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">총 수량 *</label>
                <input required type="number" min="1" value={form.totalQuantity}
                  onChange={e => setForm(p => ({ ...p, totalQuantity: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]" />
              </div>
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
