'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { uploadImage } from '@/lib/supabase';
import type { Category } from '@/types';

const RichEditor = dynamic(() => import('@/components/RichEditor'), { ssr: false });

export default function WritePostPage() {
  const router = useRouter();
  const { isLoggedIn, hydrated } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ title: '', content: '', categoryId: '', thumbnailUrl: '' });
  const [subCategoryId, setSubCategoryId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [thumbUploading, setThumbUploading] = useState(false);
  const thumbRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!isLoggedIn) { router.push('/login'); return; }
    api.get('/categories').then((res) => {
      const all: Category[] = res.data.data;
      setCategories(all);
      // 최상위 카테고리 중 첫 번째를 기본값으로
      const first = all.find((c) => !c.parentId);
      if (first) setForm((f) => ({ ...f, categoryId: String(first.id) }));
    });
  }, [hydrated, isLoggedIn]);

  // 선택된 카테고리 정보
  const selectedCat = categories.find((c) => String(c.id) === form.categoryId);
  const isLocalParent = selectedCat?.type === 'LOCAL' && !selectedCat?.parentId;
  const childCategories = isLocalParent
    ? categories.filter((c) => c.parentId === selectedCat.id)
    : [];

  // LOCAL 부모 선택 시 첫 번째 자식을 기본값으로
  useEffect(() => {
    if (isLocalParent && childCategories.length > 0) {
      setSubCategoryId(String(childCategories[0].id));
    } else {
      setSubCategoryId('');
    }
  }, [form.categoryId]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // LOCAL 부모 선택 시 자식(구) ID를 실제 categoryId로 사용
    const finalCategoryId = isLocalParent && subCategoryId
      ? Number(subCategoryId)
      : Number(form.categoryId);

    if (isLocalParent && !subCategoryId) {
      setError('구/지역을 선택해주세요.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/posts', { ...form, categoryId: finalCategoryId });
      router.push(`/posts/${res.data.data.id}`);
    } catch {
      setError('글 작성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 드롭다운에 표시할 최상위 카테고리만
  const rootCategories = categories.filter((c) => !c.parentId);

  return (
    <div className="bg-[#f4f6f8] min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <Link href="/posts" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#003478] transition">
            ← 목록으로
          </Link>
          <h1 className="text-lg font-bold text-gray-900">새 게시글 작성</h1>
          <div className="w-16" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit}>
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 space-y-4">
              {/* 카테고리 */}
              <div className="flex items-center gap-3 flex-wrap">
                <label className="text-sm font-semibold text-gray-700 w-16 shrink-0">카테고리</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478] bg-white min-w-[140px]"
                >
                  {rootCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>

                {/* LOCAL 부모 선택 시 구 드롭다운 */}
                {isLocalParent && childCategories.length > 0 && (
                  <select
                    value={subCategoryId}
                    onChange={(e) => setSubCategoryId(e.target.value)}
                    className="border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478] bg-white min-w-[120px]"
                  >
                    {childCategories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}
                {isLocalParent && childCategories.length === 0 && (
                  <span className="text-xs text-gray-400">등록된 지역이 없습니다</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-gray-700 w-16 shrink-0">제목</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="제목을 입력하세요"
                  className="flex-1 border-0 border-b border-gray-200 px-0 py-2 text-base font-medium focus:outline-none focus:border-[#003478] transition placeholder-gray-300"
                  required
                />
              </div>

              {/* 썸네일 */}
              <div className="flex items-start gap-3">
                <label className="text-sm font-semibold text-gray-700 w-16 shrink-0 pt-1">썸네일</label>
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
            </div>

            <RichEditor
              content={form.content}
              onChange={(html) => setForm((f) => ({ ...f, content: html }))}
              placeholder="내용을 입력하세요..."
            />

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex gap-2 ml-auto">
                <button type="button" onClick={() => router.back()} className="px-5 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-100 transition">
                  취소
                </button>
                <button type="submit" disabled={loading} className="px-6 py-2.5 text-sm bg-[#003478] text-white rounded-xl font-semibold hover:bg-blue-900 disabled:opacity-50 transition">
                  {loading ? '등록 중...' : '등록하기'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
