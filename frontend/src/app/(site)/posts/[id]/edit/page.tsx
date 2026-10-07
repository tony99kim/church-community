'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { uploadImage } from '@/lib/upload';
import type { Category } from '@/types';
import { isAdminRole } from '@/lib/roles';

const RichEditor = dynamic(() => import('@/components/RichEditor'), { ssr: false });

export default function EditPostPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isLoggedIn, hydrated, user } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ title: '', content: '', categoryId: '', thumbnailUrl: '' });
  const [subCategoryId, setSubCategoryId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [thumbUploading, setThumbUploading] = useState(false);
  const thumbRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!isLoggedIn) { router.replace('/login'); return; }
    Promise.all([api.get(`/posts/${id}`), api.get('/categories')]).then(([postRes, catRes]) => {
      const post = postRes.data.data;
      const all: Category[] = catRes.data.data;
      setCategories(all);
      const matched = all.find((c: Category) => c.name === post.categoryName);
      if (matched) {
        if (matched.parentId) {
          setForm({ title: post.title, content: post.content, categoryId: String(matched.parentId), thumbnailUrl: post.thumbnailUrl ?? '' });
          setSubCategoryId(String(matched.id));
        } else {
          setForm({ title: post.title, content: post.content, categoryId: String(matched.id), thumbnailUrl: post.thumbnailUrl ?? '' });
        }
      } else {
        const first = all.find((c: Category) => !c.parentId);
        setForm({ title: post.title, content: post.content, categoryId: String(first?.id ?? ''), thumbnailUrl: post.thumbnailUrl ?? '' });
      }
    }).finally(() => setLoading(false));
  }, [hydrated, isLoggedIn, id]);

  const selectedCat = categories.find((c) => String(c.id) === form.categoryId);
  const isLocalParent = selectedCat?.type === 'LOCAL' && !selectedCat?.parentId;
  const childCategories = isLocalParent ? categories.filter((c) => c.parentId === selectedCat.id) : [];

  useEffect(() => {
    if (isLocalParent && childCategories.length > 0 && !subCategoryId) {
      setSubCategoryId(String(childCategories[0].id));
    }
    if (!isLocalParent) setSubCategoryId('');
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
    const finalCategoryId = isLocalParent && subCategoryId ? Number(subCategoryId) : Number(form.categoryId);
    if (isLocalParent && !subCategoryId) { setError('구/지역을 선택해주세요.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await api.put(`/posts/${id}`, { ...form, categoryId: finalCategoryId });
      router.push(`/posts/${id}`);
    } catch {
      setError('수정에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const isAdmin = isAdminRole(user?.role);
  const rootCategories = categories.filter((c) => !c.parentId && (isAdmin || c.type !== 'NOTICE'));

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <Link href={`/posts/${id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition">
            ← 돌아가기
          </Link>
          <h1 className="text-lg font-bold text-gray-900">게시글 수정</h1>
          <div className="w-16" />
        </div>

        <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
          <form onSubmit={handleSubmit}>
            <div className="px-6 pt-6 pb-4 border-b border-border space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <label className="text-sm font-semibold text-gray-700 w-16 shrink-0">카테고리</label>
                <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white min-w-[140px] transition">
                  {rootCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {isLocalParent && childCategories.length > 0 && (
                  <select value={subCategoryId} onChange={(e) => setSubCategoryId(e.target.value)}
                    className="border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white min-w-[120px] transition">
                    {childCategories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-gray-700 w-16 shrink-0">제목</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="제목을 입력하세요"
                  className="flex-1 border-0 border-b border-border px-0 py-2 text-base font-medium focus:outline-none focus:border-primary transition placeholder-muted-foreground"
                  required />
              </div>

              <div className="flex items-start gap-3">
                <label className="text-sm font-semibold text-gray-700 w-16 shrink-0 pt-1">썸네일</label>
                <div className="flex items-center gap-3">
                  {form.thumbnailUrl && (
                    <div className="relative w-20 h-14 rounded-xl overflow-hidden border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form.thumbnailUrl} alt="썸네일" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setForm((f) => ({ ...f, thumbnailUrl: '' }))}
                        className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/50 text-white rounded-full text-[10px] flex items-center justify-center">×</button>
                    </div>
                  )}
                  <button type="button" onClick={() => thumbRef.current?.click()} disabled={thumbUploading}
                    className="text-xs text-muted-foreground border border-dashed border-border rounded-xl px-3 py-2 hover:border-primary hover:text-primary transition disabled:opacity-50">
                    {thumbUploading ? '업로드 중...' : '+ 이미지 선택'}
                  </button>
                  <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={handleThumb} />
                </div>
              </div>
            </div>

            <RichEditor content={form.content} onChange={(html) => setForm((f) => ({ ...f, content: html }))} placeholder="내용을 입력하세요..." />

            <div className="px-6 py-4 border-t border-border bg-accent/50 flex items-center justify-between">
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex gap-2 ml-auto">
                <Link href={`/posts/${id}`}
                  className="px-5 py-2.5 text-sm text-gray-600 border border-border rounded-xl hover:bg-accent transition">
                  취소
                </Link>
                <button type="submit" disabled={submitting}
                  className="px-6 py-2.5 text-sm bg-primary text-white rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 transition shadow-md shadow-primary/20">
                  {submitting ? '저장 중...' : '저장하기'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
