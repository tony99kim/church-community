'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { uploadImage } from '@/lib/supabase';

const RichEditor = dynamic(() => import('@/components/RichEditor'), { ssr: false });

interface Category { id: number; name: string; }

export default function WritePostPage() {
  const router = useRouter();
  const { isLoggedIn, hydrated } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ title: '', content: '', categoryId: '', thumbnailUrl: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [thumbUploading, setThumbUploading] = useState(false);
  const thumbRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!isLoggedIn) { router.push('/login'); return; }
    api.get('/categories').then((res) => {
      setCategories(res.data.data);
      if (res.data.data.length > 0) setForm((f) => ({ ...f, categoryId: String(res.data.data[0].id) }));
    });
  }, [hydrated, isLoggedIn]);

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
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/posts', { ...form, categoryId: Number(form.categoryId) });
      router.push(`/posts/${res.data.data.id}`);
    } catch {
      setError('글 작성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

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
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-gray-700 w-16 shrink-0">카테고리</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478] bg-white min-w-[160px]"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
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

            {/* 본문 에디터 */}
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
