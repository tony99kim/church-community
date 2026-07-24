'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Church } from '@/types';

const EMPTY_FORM = {
  name: '', address: '', sundayServiceTime: '', hasYouthGroup: false,
  contactInfo: '', introduction: '', websiteUrl: '', instagramUrl: '', imageUrl: '', visible: true,
};

export default function AdminChurchesPage() {
  const [churches, setChurches] = useState<Church[]>([]);
  const [createForm, setCreateForm] = useState({ ...EMPTY_FORM });
  const [editTarget, setEditTarget] = useState<Church | null>(null);
  const [editForm, setEditForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const fetchChurches = () => {
    api.get('/admin/churches').then(r => setChurches(r.data.data ?? []));
  };

  useEffect(() => { fetchChurches(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/admin/churches', createForm);
      setCreateForm({ ...EMPTY_FORM });
      fetchChurches();
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (c: Church) => {
    setEditTarget(c);
    setEditForm({
      name: c.name,
      address: c.address,
      sundayServiceTime: c.sundayServiceTime ?? '',
      hasYouthGroup: c.hasYouthGroup,
      contactInfo: c.contactInfo ?? '',
      introduction: c.introduction ?? '',
      websiteUrl: c.websiteUrl ?? '',
      instagramUrl: c.instagramUrl ?? '',
      imageUrl: c.imageUrl ?? '',
      visible: c.visible,
    });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setSaving(true);
    try {
      await api.put(`/admin/churches/${editTarget.id}`, editForm);
      setEditTarget(null);
      fetchChurches();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('삭제하시겠습니까?')) return;
    await api.delete(`/admin/churches/${id}`);
    fetchChurches();
  };

  const FormFields = ({
    form, setForm,
  }: {
    form: typeof EMPTY_FORM;
    setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>;
  }) => (
    <>
      <input required placeholder="교회명 *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="col-span-2 px-3 py-2 border border-[#EDEFF1] rounded-lg text-sm" />
      <input required placeholder="주소 *" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className="col-span-2 px-3 py-2 border border-[#EDEFF1] rounded-lg text-sm" />
      <input placeholder="주일예배 시간" value={form.sundayServiceTime} onChange={e => setForm(p => ({ ...p, sundayServiceTime: e.target.value }))} className="px-3 py-2 border border-[#EDEFF1] rounded-lg text-sm" />
      <input placeholder="연락처" value={form.contactInfo} onChange={e => setForm(p => ({ ...p, contactInfo: e.target.value }))} className="px-3 py-2 border border-[#EDEFF1] rounded-lg text-sm" />
      <input placeholder="한 줄 소개" value={form.introduction} onChange={e => setForm(p => ({ ...p, introduction: e.target.value }))} className="col-span-2 px-3 py-2 border border-[#EDEFF1] rounded-lg text-sm" />
      <input placeholder="홈페이지 URL" value={form.websiteUrl} onChange={e => setForm(p => ({ ...p, websiteUrl: e.target.value }))} className="px-3 py-2 border border-[#EDEFF1] rounded-lg text-sm" />
      <input placeholder="인스타그램 URL" value={form.instagramUrl} onChange={e => setForm(p => ({ ...p, instagramUrl: e.target.value }))} className="px-3 py-2 border border-[#EDEFF1] rounded-lg text-sm" />
      <input placeholder="대표 이미지 URL" value={form.imageUrl} onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))} className="col-span-2 px-3 py-2 border border-[#EDEFF1] rounded-lg text-sm" />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.hasYouthGroup} onChange={e => setForm(p => ({ ...p, hasYouthGroup: e.target.checked }))} className="accent-[#003478]" />
        청년부 있음
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.visible} onChange={e => setForm(p => ({ ...p, visible: e.target.checked }))} className="accent-[#003478]" />
        공개
      </label>
    </>
  );

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-6">교회 관리</h1>

      {/* 등록 폼 */}
      <form onSubmit={handleCreate} className="bg-white border border-[#EDEFF1] rounded-xl p-4 mb-6 grid grid-cols-2 gap-3">
        <h2 className="col-span-2 text-sm font-semibold text-gray-700 mb-1">새 교회 등록</h2>
        <FormFields form={createForm} setForm={setCreateForm} />
        <button type="submit" disabled={saving} className="col-span-2 py-2 bg-[#003478] text-white rounded-lg text-sm font-medium disabled:opacity-50">
          {saving ? '등록 중...' : '교회 추가'}
        </button>
      </form>

      {/* 목록 */}
      <div className="space-y-2">
        {churches.map(c => (
          <div key={c.id} className="flex items-center justify-between bg-white border border-[#EDEFF1] rounded-xl px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              {c.imageUrl && (
                <img src={c.imageUrl} alt={c.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
              )}
              <div className="min-w-0">
                <div className="font-medium text-sm flex items-center gap-1.5">
                  {c.name}
                  {!c.visible && <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">비공개</span>}
                  {c.hasYouthGroup && <span className="text-[10px] bg-blue-50 text-[#003478] px-1.5 py-0.5 rounded">청년부</span>}
                </div>
                <div className="text-xs text-gray-400 truncate">{c.address}</div>
              </div>
            </div>
            <div className="flex gap-2 shrink-0 ml-3">
              <button onClick={() => openEdit(c)} className="text-xs text-[#003478] border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition">수정</button>
              <button onClick={() => handleDelete(c.id)} className="text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition">삭제</button>
            </div>
          </div>
        ))}
        {churches.length === 0 && (
          <div className="bg-white border border-[#EDEFF1] rounded-xl py-12 text-center text-gray-400 text-sm">
            등록된 교회가 없습니다.
          </div>
        )}
      </div>

      {/* 수정 모달 */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="font-bold text-gray-900 mb-4">교회 수정 — {editTarget.name}</h2>
            <form onSubmit={handleEdit} className="grid grid-cols-2 gap-3">
              <FormFields form={editForm} setForm={setEditForm} />
              <div className="col-span-2 flex gap-2 justify-end mt-2">
                <button type="button" onClick={() => setEditTarget(null)} className="px-4 py-2 text-sm border border-gray-300 rounded-xl hover:bg-gray-50">취소</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-[#003478] text-white rounded-xl font-semibold hover:bg-blue-900 disabled:opacity-50">
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
