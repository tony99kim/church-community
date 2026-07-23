'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Church } from '@/types';

export default function AdminChurchesPage() {
  const [churches, setChurches] = useState<Church[]>([]);
  const [form, setForm] = useState({
    name: '', address: '', sundayServiceTime: '', hasYouthGroup: false,
    contactInfo: '', introduction: '', websiteUrl: '', instagramUrl: ''
  });

  const fetchChurches = () => {
    api.get('/churches').then(r => setChurches(r.data.data ?? []));
  };

  useEffect(() => { fetchChurches(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/admin/churches', form);
    setForm({ name: '', address: '', sundayServiceTime: '', hasYouthGroup: false, contactInfo: '', introduction: '', websiteUrl: '', instagramUrl: '' });
    fetchChurches();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('삭제하시겠습니까?')) return;
    await api.delete(`/admin/churches/${id}`);
    fetchChurches();
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-6">교회 관리</h1>
      <form onSubmit={handleCreate} className="bg-white border border-[#EDEFF1] rounded-xl p-4 mb-6 grid grid-cols-2 gap-3">
        <input required placeholder="교회명 *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="col-span-2 px-3 py-2 border border-[#EDEFF1] rounded-lg text-sm" />
        <input required placeholder="주소 *" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className="col-span-2 px-3 py-2 border border-[#EDEFF1] rounded-lg text-sm" />
        <input placeholder="주일예배 시간" value={form.sundayServiceTime} onChange={e => setForm(p => ({ ...p, sundayServiceTime: e.target.value }))} className="px-3 py-2 border border-[#EDEFF1] rounded-lg text-sm" />
        <input placeholder="연락처" value={form.contactInfo} onChange={e => setForm(p => ({ ...p, contactInfo: e.target.value }))} className="px-3 py-2 border border-[#EDEFF1] rounded-lg text-sm" />
        <input placeholder="한 줄 소개" value={form.introduction} onChange={e => setForm(p => ({ ...p, introduction: e.target.value }))} className="col-span-2 px-3 py-2 border border-[#EDEFF1] rounded-lg text-sm" />
        <input placeholder="홈페이지 URL" value={form.websiteUrl} onChange={e => setForm(p => ({ ...p, websiteUrl: e.target.value }))} className="px-3 py-2 border border-[#EDEFF1] rounded-lg text-sm" />
        <input placeholder="인스타그램 URL" value={form.instagramUrl} onChange={e => setForm(p => ({ ...p, instagramUrl: e.target.value }))} className="px-3 py-2 border border-[#EDEFF1] rounded-lg text-sm" />
        <label className="flex items-center gap-2 text-sm col-span-2">
          <input type="checkbox" checked={form.hasYouthGroup} onChange={e => setForm(p => ({ ...p, hasYouthGroup: e.target.checked }))} className="accent-[#003478]" />
          청년부 있음
        </label>
        <button type="submit" className="col-span-2 py-2 bg-[#003478] text-white rounded-lg text-sm font-medium">교회 추가</button>
      </form>
      <div className="space-y-2">
        {churches.map(c => (
          <div key={c.id} className="flex items-center justify-between bg-white border border-[#EDEFF1] rounded-xl px-4 py-3">
            <div>
              <div className="font-medium text-sm">{c.name}</div>
              <div className="text-xs text-gray-400">{c.address}</div>
            </div>
            <button onClick={() => handleDelete(c.id)} className="text-xs text-red-500 hover:underline">삭제</button>
          </div>
        ))}
      </div>
    </div>
  );
}
