'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Post, Category } from '@/types';
import { useAuthStore } from '@/store/authStore';
import Pagination from '@/components/Pagination';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function CommunityPage() {
  const { isLoggedIn, hydrated } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');

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
    setKeyword('');
    setSearchInput('');
  }, [activeCategory]);

  useEffect(() => { setPage(0); }, [keyword]);

  useEffect(() => {
    if (!activeCategory) return;
    setLoading(true);
    setPosts([]);
    const controller = new AbortController();
    const params = new URLSearchParams({ categoryId: String(activeCategory), size: '20', page: String(page), sort: 'createdAt,desc' });
    if (keyword) params.set('keyword', keyword);
    api.get(`/posts?${params}`, { signal: controller.signal })
      .then(r => {
        const content: Post[] = r.data.data?.content ?? [];
        const sorted = [...content].sort((a, b) => (b.notice ? 1 : 0) - (a.notice ? 1 : 0));
        setPosts(sorted);
        setTotalPages(r.data.data?.totalPages ?? 0);
      })
      .catch(err => { if (err.code !== 'ERR_CANCELED') throw err; })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [activeCategory, page, keyword]);

  return (
    <main className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900">커뮤니티 💬</h1>
          <p className="text-sm text-muted-foreground mt-1">자유롭게 이야기를 나눠보세요</p>
        </div>

        {/* 카테고리 탭 */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                activeCategory === cat.id
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'bg-white border border-border text-gray-600 hover:border-primary hover:text-primary'
              }`}>
              {cat.name}
            </button>
          ))}
        </div>

        {/* 검색 + 글쓰기 */}
        <div className="flex gap-2 mb-6">
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') setKeyword(searchInput); }}
            placeholder="게시글 검색..."
            className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
          />
          <button onClick={() => setKeyword(searchInput)}
            className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
            검색
          </button>
          {activeCategory && hydrated && (
            <Link href={isLoggedIn ? `/posts/write?categoryId=${activeCategory}` : '/login'}
              className="px-4 py-2.5 border-2 border-primary text-primary rounded-xl text-sm font-semibold hover:bg-primary/5 transition-colors whitespace-nowrap">
              + 글쓰기
            </Link>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="px-5 py-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <Card className="py-16 text-center">
            <div className="text-3xl mb-2">💬</div>
            <p className="text-muted-foreground text-sm">게시글이 없습니다.</p>
          </Card>
        ) : (
          <Card className="overflow-hidden divide-y divide-border">
            {posts.map(post => (
              <Link key={post.id} href={`/posts/${post.id}`}
                className={`flex items-center gap-3 px-5 py-3.5 hover:bg-accent/50 transition-colors ${post.notice ? 'bg-blue-50/50' : ''}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {post.notice && (
                      <Badge className="shrink-0 text-[10px] bg-primary text-white border-0 px-1.5 py-0.5 rounded">공지</Badge>
                    )}
                    <span className="text-sm font-medium text-gray-800 truncate">{post.title}</span>
                    {post.commentCount > 0 && (
                      <span className="text-xs text-primary font-bold shrink-0 bg-primary/5 px-1 rounded">[{post.commentCount}]</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {post.authorNickname} · {new Date(post.createdAt).toLocaleDateString()} · 👁 {post.viewCount}
                  </div>
                </div>
                {post.likeCount > 0 && (
                  <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-0.5">
                    <span className="text-red-400">❤</span> {post.likeCount}
                  </span>
                )}
              </Link>
            ))}
          </Card>
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
