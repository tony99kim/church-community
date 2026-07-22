'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Category } from '@/types';

const TYPE_OPTIONS = [
  { value: 'COMMUNITY', label: '커뮤니티' },
  { value: 'EVENT', label: '행사' },
  { value: 'LOCAL', label: '지역' },
  { value: 'NOTICE', label: '공지' },
];

const TYPE_LABEL: Record<string, string> = {
  COMMUNITY: '커뮤니티', EVENT: '행사', LOCAL: '지역', NOTICE: '공지',
};

const EMPTY_FORM = { name: '', description: '', type: 'COMMUNITY', sortOrder: 0, parentId: '' };

const CITIES: { name: string; sortOrder: number; districts: string[] }[] = [
  {
    name: '부산',
    sortOrder: 20,
    districts: ['중구','서구','동구','영도구','부산진구','동래구','남구','북구','해운대구','사하구','금정구','강서구','연제구','수영구','사상구','기장군'],
  },
  {
    name: '대구',
    sortOrder: 30,
    districts: ['중구','동구','서구','남구','북구','수성구','달서구','달성군'],
  },
  {
    name: '인천',
    sortOrder: 40,
    districts: ['중구','동구','미추홀구','연수구','남동구','부평구','계양구','서구','강화군','옹진군'],
  },
  {
    name: '광주',
    sortOrder: 50,
    districts: ['동구','서구','남구','북구','광산구'],
  },
  {
    name: '대전',
    sortOrder: 60,
    districts: ['동구','중구','서구','유성구','대덕구'],
  },
  {
    name: '울산',
    sortOrder: 70,
    districts: ['중구','남구','동구','북구','울주군'],
  },
];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<{ name: string; description: string; type: string; sortOrder: number; parentId: string }>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [seeding, setSeeding] = useState<string | null>(null); // 현재 등록 중인 도시명
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<Set<number>>(new Set()); // 펼친 LOCAL 부모 ID

  const fetchCategories = () => {
    setLoading(true);
    api.get('/admin/categories')
      .then((res) => setCategories(res.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCategories(); }, []);

  const toggleExpand = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setError(''); setShowModal(true); };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description || '', type: cat.type, sortOrder: cat.sortOrder ?? 0, parentId: cat.parentId ? String(cat.parentId) : '' });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const body = { ...form, sortOrder: Number(form.sortOrder), parentId: form.parentId ? Number(form.parentId) : null };
      if (editing) {
        await api.put(`/admin/categories/${editing.id}`, { ...body, visible: true });
      } else {
        await api.post('/admin/categories', body);
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
    if (!confirm(`"${cat.name}" 카테고리를 삭제하시겠어요?\n하위 카테고리도 함께 삭제됩니다.`)) return;
    try {
      await api.delete(`/admin/categories/${cat.id}`);
      fetchCategories();
    } catch { alert('삭제에 실패했습니다.'); }
  };

  const handleToggleVisible = async (cat: Category) => {
    try {
      await api.put(`/admin/categories/${cat.id}`, { name: cat.name, description: cat.description, type: cat.type, sortOrder: cat.sortOrder, visible: !cat.visible });
      fetchCategories();
    } catch { alert('변경에 실패했습니다.'); }
  };

  // 도시 일괄 등록
  const seedCity = async (city: typeof CITIES[0]) => {
    if (!confirm(`${city.name} + ${city.districts.length}개 구/군을 등록합니다. 계속할까요?`)) return;
    setSeeding(city.name);
    try {
      const res = await api.post('/admin/categories', { name: city.name, type: 'LOCAL', sortOrder: city.sortOrder });
      const cityId = res.data.data.id;
      for (let i = 0; i < city.districts.length; i++) {
        await api.post('/admin/categories', { name: city.districts[i], type: 'LOCAL', parentId: cityId, sortOrder: i });
      }
      fetchCategories();
    } catch { alert(`${city.name} 등록에 실패했습니다.`); }
    finally { setSeeding(null); }
  };

  // 서울 일괄 등록
  const seedSeoul = async () => {
    const seoulDistricts = ['강남구','강동구','강북구','강서구','관악구','광진구','구로구','금천구','노원구','도봉구','동대문구','동작구','마포구','서대문구','서초구','성동구','성북구','송파구','양천구','영등포구','용산구','은평구','종로구','중구','중랑구'];
    if (!confirm(`서울 + ${seoulDistricts.length}개 자치구를 등록합니다. 계속할까요?`)) return;
    setSeeding('서울');
    try {
      const res = await api.post('/admin/categories', { name: '서울', type: 'LOCAL', sortOrder: 10 });
      const id = res.data.data.id;
      for (let i = 0; i < seoulDistricts.length; i++) {
        await api.post('/admin/categories', { name: seoulDistricts[i], type: 'LOCAL', parentId: id, sortOrder: i });
      }
      fetchCategories();
    } catch { alert('서울 등록에 실패했습니다.'); }
    finally { setSeeding(null); }
  };

  const localParents = categories.filter((c) => c.type === 'LOCAL' && !c.parentId);
  const rootCategories = categories.filter((c) => !c.parentId);
  const nonLocalRoots = rootCategories.filter((c) => c.type !== 'LOCAL');

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">카테고리 관리</h1>
          <p className="text-sm text-gray-500 mt-1">게시판 카테고리를 추가, 수정, 삭제할 수 있습니다</p>
        </div>
        <button onClick={openCreate} className="bg-[#003478] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-900 transition">
          + 카테고리 추가
        </button>
      </div>

      {/* 지역 일괄 등록 */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6">
        <p className="text-xs font-semibold text-gray-500 mb-3">지역 카테고리 일괄 등록</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={seedSeoul}
            disabled={seeding !== null}
            className="text-sm border border-gray-200 px-4 py-1.5 rounded-xl hover:bg-gray-50 transition disabled:opacity-40"
          >
            {seeding === '서울' ? '등록 중...' : '🗺 서울'}
          </button>
          {CITIES.map((city) => (
            <button
              key={city.name}
              onClick={() => seedCity(city)}
              disabled={seeding !== null}
              className="text-sm border border-gray-200 px-4 py-1.5 rounded-xl hover:bg-gray-50 transition disabled:opacity-40"
            >
              {seeding === city.name ? '등록 중...' : `🗺 ${city.name}`}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">이미 등록된 도시가 있으면 중복 등록될 수 있습니다. 확인 후 눌러주세요.</p>
      </div>

      {/* 일반 카테고리 */}
      {nonLocalRoots.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-4">
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            일반 카테고리
          </div>
          <ul className="divide-y divide-gray-50">
            {nonLocalRoots.map((cat) => (
              <li key={cat.id} className="grid grid-cols-[1fr_80px_100px] gap-4 px-6 py-3 items-center hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggleVisible(cat)} className={`w-2 h-2 rounded-full shrink-0 ${cat.visible ? 'bg-green-400' : 'bg-gray-300'}`} title={cat.visible ? '표시 중' : '숨김'} />
                  <span className="font-medium text-sm text-gray-900">{cat.name}</span>
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{TYPE_LABEL[cat.type] ?? cat.type}</span>
                  {!cat.visible && <span className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">숨김</span>}
                </div>
                <span className="text-xs text-gray-400 text-center">순서 {cat.sortOrder}</span>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => openEdit(cat)} className="text-xs text-gray-500 hover:text-[#003478] border border-gray-200 px-2.5 py-1 rounded-lg hover:border-blue-200">수정</button>
                  <button onClick={() => handleDelete(cat)} className="text-xs text-gray-500 hover:text-red-500 border border-gray-200 px-2.5 py-1 rounded-lg hover:border-red-200">삭제</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 지역 카테고리 (접기/펼치기) */}
      {localParents.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">지역 카테고리</span>
            <div className="flex gap-2">
              <button
                onClick={() => setExpanded(new Set(localParents.map((c) => c.id)))}
                className="text-xs text-gray-400 hover:text-[#003478]"
              >
                전체 펼치기
              </button>
              <span className="text-gray-200">|</span>
              <button
                onClick={() => setExpanded(new Set())}
                className="text-xs text-gray-400 hover:text-[#003478]"
              >
                전체 접기
              </button>
            </div>
          </div>
          <ul className="divide-y divide-gray-100">
            {localParents.map((region) => {
              const children = categories.filter((c) => c.parentId === region.id);
              const isExpanded = expanded.has(region.id);
              return (
                <li key={region.id}>
                  {/* 시/도 헤더 */}
                  <div className="flex items-center px-6 py-3 hover:bg-gray-50 group">
                    <button
                      onClick={() => toggleExpand(region.id)}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      <span className="text-gray-400 text-xs w-4">{isExpanded ? '▼' : '▶'}</span>
                      <button onClick={() => handleToggleVisible(region)} className={`w-2 h-2 rounded-full shrink-0 ${region.visible ? 'bg-green-400' : 'bg-gray-300'}`} title={region.visible ? '표시 중' : '숨김'} />
                      <span className="font-semibold text-sm text-gray-900">{region.name}</span>
                      <span className="text-xs text-gray-400">({children.length}개 구/군)</span>
                    </button>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => openEdit(region)} className="text-xs text-gray-500 hover:text-[#003478] border border-gray-200 px-2.5 py-1 rounded-lg hover:border-blue-200">수정</button>
                      <button onClick={() => handleDelete(region)} className="text-xs text-gray-500 hover:text-red-500 border border-gray-200 px-2.5 py-1 rounded-lg hover:border-red-200">삭제</button>
                    </div>
                  </div>

                  {/* 구 목록 */}
                  {isExpanded && (
                    <ul className="bg-gray-50 border-t border-gray-100 divide-y divide-gray-100">
                      {children.map((child) => (
                        <li key={child.id} className="flex items-center gap-3 pl-12 pr-6 py-2 hover:bg-gray-100 group">
                          <span className="text-gray-300 text-xs">└</span>
                          <button onClick={() => handleToggleVisible(child)} className={`w-1.5 h-1.5 rounded-full shrink-0 ${child.visible ? 'bg-green-400' : 'bg-gray-300'}`} />
                          <span className={`text-sm flex-1 ${child.visible ? 'text-gray-700' : 'text-gray-400'}`}>{child.name}</span>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                            <button onClick={() => openEdit(child)} className="text-xs text-gray-500 hover:text-[#003478] border border-gray-200 px-2.5 py-1 rounded-lg">수정</button>
                            <button onClick={() => handleDelete(child)} className="text-xs text-gray-500 hover:text-red-500 border border-gray-200 px-2.5 py-1 rounded-lg">삭제</button>
                          </div>
                        </li>
                      ))}
                      <li className="pl-12 pr-6 py-2">
                        <button
                          onClick={() => { setForm({ ...EMPTY_FORM, type: 'LOCAL', parentId: String(region.id) }); setEditing(null); setShowModal(true); }}
                          className="text-xs text-[#003478] hover:underline"
                        >
                          + 구/군 추가
                        </button>
                      </li>
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {loading && <div className="p-8 text-center text-gray-400">불러오는 중...</div>}

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
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">이름 <span className="text-red-500">*</span></label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="예: 마포구" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">타입 <span className="text-red-500">*</span></label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, parentId: '' })} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478] bg-white">
                  {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              {form.type === 'LOCAL' && localParents.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">상위 지역 (구 단위일 경우 선택)</label>
                  <select value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478] bg-white">
                    <option value="">— 최상위 (시/도)</option>
                    {localParents.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">설명</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="설명 (선택)" className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">정렬 순서</label>
                <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]" />
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">취소</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-[#003478] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-900 disabled:opacity-50">
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
