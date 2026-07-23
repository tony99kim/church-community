'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Post, Category } from '@/types';
import { useAuthStore } from '@/store/authStore';

export default function CommunityPage() {
  const { isLoggedIn } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

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
    if (!activeCategory) return;
    setLoading(true);
    api.get(`/posts?categoryId=${activeCategory}&size=20`)
      .then(r => setPosts(r.data.data?.content ?? []))
      .finally(() => setLoading(false));
  }, [activeCategory]);

  return (
    <main className="min-h-screen bg-[#f4f6f8] py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-[#003478] mb-6">커뮤니티 💬</h1>

        <div className="flex gap-2 mb-6">
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === cat.id ? 'bg-[#003478] text-white' : 'bg-white border border-[#EDEFF1] text-gray-600'}`}>
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
                <div>
                  <div className="text-sm font-medium text-gray-800">{post.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{post.authorNickname} · {new Date(post.createdAt).toLocaleDateString()}</div>
                </div>
                {post.commentCount > 0 && (
                  <span className="text-xs text-gray-400">[{post.commentCount}]</span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
