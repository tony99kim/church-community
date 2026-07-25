'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Post, Category } from '@/types';
import { useAuthStore } from '@/store/authStore';
import Pagination from '@/components/Pagination';

export default function CommunityPage() {
  const { isLoggedIn } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    api.get('/categories').then(r => {
      const cats: Category[] = (r.data.data ?? []).filter((c: Category) =>
        ['NOTICE', 'FREE', 'GATHERING'].includes(c.type)
      );
      setCategories(cats);
      if (cats.length > 0) setActiveCategory(cats[0].id);
    });
  }, []);

  useEffect(() => {
    setPage(0);
  }, [activeCategory]);

  useEffect(() => {
    if (!activeCategory) return;
    setLoading(true);
    setPosts([]);
    const controller = new AbortController();
    api.get(`/posts?categoryId=${activeCategory}&size=20&page=${page}&sort=createdAt,desc`, { signal: controller.signal })
      .then(r => {
        setPosts(r.data.data?.content ?? []);
        setTotalPages(r.data.data?.totalPages ?? 0);
      })
      .catch(err => { if (err.code !== 'ERR_CANCELED') throw err; })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [activeCategory, page]);

  return (
    <main className="min-h-screen bg-[#f4f6f8] py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-[#003478] mb-6">커뮤니티 💬</h1>

        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === cat.id ? 'bg-[#003478] text-white' : 'bg-white border border-[#EDEFF1] text-gray-600'}`}>
              {cat.name}
            </button>
          ))}
        </div>

        {isLoggedIn && activeCategory && (
          <div className="flex justify-end mb-4">
            <Link href={`/posts/write?categoryId=${activeCategory}`}
              className="px-4 py-2 bg-[#003478] text-white rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors">
              글쓰기
            </Link>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">불러오는 중...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">게시글이 없습니다.</div>
        ) : (
          <div className="space-y-2">
            {posts.map(post => (
              <Link key={post.id} href={`/posts/${post.id}`}
                className="flex items-center justify-between bg-white rounded-xl border border-[#EDEFF1] px-4 py-3 hover:border-[#003478] transition-colors">
                <div className="min-w-0 flex-1 mr-2">
                  <div className="text-sm font-medium text-gray-800 truncate">{post.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{post.authorNickname} · {new Date(post.createdAt).toLocaleDateString()}</div>
                </div>
                {post.commentCount > 0 && (
                  <span className="text-xs text-gray-400 shrink-0">[{post.commentCount}]</span>
                )}
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination page={page} totalPages={totalPages} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
          </div>
        )}
      </div>
    </main>
  );
}
