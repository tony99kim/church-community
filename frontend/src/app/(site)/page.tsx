'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import { useAuthStore } from '@/store/authStore';
import { formatDate } from '@/lib/utils';
import type { Post } from '@/types';

function HomeFeed() {
  const { isLoggedIn } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/posts', { params: { page: 0, size: 20, sort: 'createdAt,desc' } })
      .then((r) => setPosts(r.data.data.content))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex gap-6 max-w-6xl mx-auto px-4 py-5">
      <Sidebar activeCategoryId={null} />

      <div className="flex-1 min-w-0">
        {/* 웰컴 배너 */}
        <div className="bg-gradient-to-r from-[#003478] to-[#0056b3] rounded-xl px-5 py-4 text-white mb-4 flex items-center justify-between">
          <div>
            <div className="font-bold text-base">ChurchHub에 오신 걸 환영합니다 👋</div>
            <div className="text-blue-200 text-xs mt-0.5">지역 청년들의 이야기를 나눠보세요</div>
          </div>
          {!isLoggedIn && (
            <Link href="/register" className="shrink-0 bg-white text-[#003478] text-xs font-bold px-4 py-1.5 rounded-full hover:bg-blue-50 transition">
              가입하기
            </Link>
          )}
        </div>

        {/* 정렬 헤더 */}
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-sm font-bold text-gray-700">최신 게시글</span>
          <Link href="/posts" className="text-xs text-[#003478] font-medium hover:underline">전체보기 →</Link>
        </div>

        {/* 게시글 목록 */}
        <div className="bg-white border border-[#EDEFF1] rounded-xl overflow-hidden">
          {loading ? (
            <ul className="divide-y divide-[#EDEFF1]">
              {[...Array(10)].map((_, i) => (
                <li key={i} className="px-4 py-3 animate-pulse flex gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-50 rounded w-1/3" />
                  </div>
                </li>
              ))}
            </ul>
          ) : posts.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-3xl mb-2">📭</div>
              <p className="text-gray-400 text-sm">아직 게시글이 없어요.</p>
              {isLoggedIn && (
                <Link href="/posts/write" className="inline-block mt-3 text-[#003478] text-sm font-medium hover:underline">
                  첫 글 작성하기 →
                </Link>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-[#EDEFF1]">
              {posts.map((post) => (
                <li key={post.id}>
                  <Link href={`/posts/${post.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="shrink-0 text-xs bg-blue-50 text-[#003478] border border-blue-100 px-2 py-0.5 rounded font-medium">
                          {post.categoryName}
                        </span>
                        <span className="text-sm font-medium text-gray-900 truncate group-hover:text-[#003478] transition">
                          {post.title}
                        </span>
                        {post.commentCount > 0 && (
                          <span className="shrink-0 text-xs text-[#003478] font-bold">[{post.commentCount}]</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{post.authorNickname}</span>
                        <span>·</span>
                        <span>{formatDate(post.createdAt)}</span>
                        <span>·</span>
                        <span>👁 {post.viewCount}</span>
                        {post.likeCount > 0 && (
                          <>
                            <span>·</span>
                            <span>❤ {post.likeCount}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeFeed />
    </Suspense>
  );
}
