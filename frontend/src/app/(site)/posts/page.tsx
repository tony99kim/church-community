'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import { formatDate } from '@/lib/utils';
import type { Post, Category } from '@/types';

function PostsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryId = searchParams.get('categoryId');

  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setPage(0);
    setKeyword('');
    setSearchInput('');
  }, [categoryId]);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, unknown> = { page, size: 20, sort: 'createdAt,desc' };
    if (categoryId) params.categoryId = categoryId;
    if (keyword) params.keyword = keyword;
    api.get('/posts', { params })
      .then((r) => {
        setPosts(r.data.data.content);
        setTotalPages(r.data.data.totalPages);
        setTotalElements(r.data.data.totalElements);
      })
      .finally(() => setLoading(false));
  }, [categoryId, page, keyword]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(searchInput);
    setPage(0);
  };

  const activeCategoryName = categories.find((c) => String(c.id) === categoryId)?.name;

  return (
    <div className="flex gap-6 max-w-6xl mx-auto px-4 py-5">
      <Sidebar activeCategoryId={categoryId} />

      <div className="flex-1 min-w-0">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              {activeCategoryName ?? '전체 게시판'}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">게시글 {totalElements.toLocaleString()}개</p>
          </div>
        </div>

        {/* 검색바 */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="검색어 입력"
              className="w-full bg-white border border-[#EDEFF1] rounded-full px-4 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478] focus:border-transparent"
            />
          </div>
          <button type="submit" className="bg-[#003478] text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-[#002560] transition">
            검색
          </button>
        </form>

        {/* 게시글 목록 */}
        <div className="bg-white border border-[#EDEFF1] rounded-xl overflow-hidden mb-4">
          {/* 테이블 헤더 - 데스크탑 */}
          <div className="hidden md:grid grid-cols-[1fr_auto] gap-4 px-4 py-2.5 border-b border-[#EDEFF1] bg-gray-50">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">제목</span>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">정보</span>
          </div>

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
              <p className="text-gray-400 text-sm">게시글이 없습니다.</p>
            </div>
          ) : (
            <ul className="divide-y divide-[#EDEFF1]">
              {posts.map((post) => (
                <li key={post.id}>
                  <Link href={`/posts/${post.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition group">
                    <div className="flex-1 min-w-0 mr-3">
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
                        <span className="font-medium text-gray-600">{post.authorNickname}</span>
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
                    {post.thumbnailUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.thumbnailUrl} alt="" className="w-16 h-12 object-cover rounded-lg shrink-0 border border-gray-100" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-1">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-full text-sm border border-[#EDEFF1] bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30"
            >
              ‹
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const pageNum = Math.max(0, Math.min(page - 3, totalPages - 7)) + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-9 h-9 rounded-full text-sm font-medium transition ${
                    page === pageNum ? 'bg-[#003478] text-white' : 'bg-white border border-[#EDEFF1] text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {pageNum + 1}
                </button>
              );
            })}
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-full text-sm border border-[#EDEFF1] bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30"
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PostsPage() {
  return (
    <Suspense fallback={<div className="flex gap-6 max-w-6xl mx-auto px-4 py-5 animate-pulse"><div className="w-64 shrink-0 hidden lg:block"><div className="h-40 bg-gray-100 rounded-xl" /></div><div className="flex-1"><div className="h-8 bg-gray-100 rounded w-1/3 mb-4" /><div className="h-64 bg-gray-100 rounded-xl" /></div></div>}>
      <PostsContent />
    </Suspense>
  );
}
