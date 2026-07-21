'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Category {
  id: number;
  name: string;
  description: string;
  type: string;
  visible: boolean;
  sortOrder: number;
}

const TYPE_OPTIONS = [
  { value: 'COMMUNITY', label: '커뮤니티' },
  { value: 'EVENT', label: '행사' },
  { value: 'LOCAL', label: '지역' },
  { value: 'NOTICE', label: '공지' },
];

const emptyForm = { name: '', description: '', type: 'COMMUNITY', sortOrder: 0 };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<{ name: string; description: string; type: string; sortOrder: number }>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchCategories = () => {
    setLoading(true);
    api.get('/admin/categories')
      .then((res) => setCategories(res.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCategories(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description || '', type: cat.type, sortOrder: cat.sortOrder });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (editing) {
        await api.put(`/admin/categories/${editing.id}`, { ...form, visible: true });
      } else {
        await api.post('/admin/categories', form);
      }
      setShowModal(false);
      fetchCategories();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || '저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`"${cat.name}" 카테고리를 삭제하시겠어요?\n해당 카테고리의 게시글도 영향을 받을 수 있습니다.`)) return;
    try {
      await api.delete(`/admin/categories/${cat.id}`);
      fetchCategories();
    } catch {
      alert('삭제에 실패했습니다.');
    }
  };

  const handleToggleVisible = async (cat: Category) => {
    try {
      await api.put(`/admin/categories/${cat.id}`, {
        name: cat.name,
        description: cat.description,
        type: cat.type,
        sortOrder: cat.sortOrder,
        visible: !cat.visible,
      });
      fetchCategories();
    } catch {
      alert('변경에 실패했습니다.');
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">카테고리 관리</h1>
          <p className="text-sm text-gray-500 mt-1">게시판 카테고리를 추가, 수정, 삭제할 수 있습니다</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-[#003478] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-900 transition"
        >
          + 카테고리 추가
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_80px_80px_120px] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <span>이름</span>
          <span>설명</span>
          <span className="text-center">타입</span>
          <span className="text-center">순서</span>
          <span className="text-center">관리</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">불러오는 중...</div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">📁</div>
            <p className="text-gray-500 text-sm">카테고리가 없습니다.</p>
            <button onClick={openCreate} className="mt-4 text-[#003478] text-sm font-medium hover:underline">
              첫 카테고리 추가하기 →
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {categories.map((cat) => (
              <li key={cat.id} className="grid grid-cols-[1fr_1fr_80px_80px_120px] gap-4 px-6 py-4 items-center hover:bg-gray-50 transition">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleVisible(cat)}
                    className={`w-2 h-2 rounded-full shrink-0 ${cat.visible ? 'bg-green-400' : 'bg-gray-300'}`}
                    title={cat.visible ? '표시 중 (클릭 시 숨김)' : '숨김 (클릭 시 표시)'}
                  />
                  <span className="font-medium text-gray-900 text-sm">{cat.name}</span>
                  {!cat.visible && <span className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">숨김</span>}
                </div>
                <span className="text-sm text-gray-500 truncate">{cat.description || '–'}</span>
                <span className="text-center">
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{cat.type}</span>
                </span>
                <span className="text-center text-sm text-gray-500">{cat.sortOrder}</span>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => openEdit(cat)}
                    className="text-xs text-gray-500 hover:text-[#003478] border border-gray-200 px-3 py-1.5 rounded-lg hover:border-blue-200 transition"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(cat)}
                    className="text-xs text-gray-500 hover:text-red-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-red-200 transition"
                  >
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">{editing ? '카테고리 수정' : '카테고리 추가'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">카테고리 이름 <span className="text-red-500">*</span></label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="예: 자유게시판"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">설명</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="카테고리 설명 (선택)"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">타입 <span className="text-red-500">*</span></label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478] bg-white"
                >
                  {TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">정렬 순서</label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]"
                />
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#003478] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-900 disabled:opacity-50 transition"
                >
                  {submitting ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
