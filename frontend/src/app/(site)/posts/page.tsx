'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface Post {
  id: number;
  title: string;
  authorNickname: string;
  categoryName: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

interface Category {
  id: number;
  name: string;
  type: string;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return '방금 전';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
  return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

function PostsContent() {
  const { isLoggedIn } = useAuthStore();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

  // URL 파라미터로 초기 카테고리 설정
  useEffect(() => {
    api.get('/categories').then((res) => {
      const cats: Category[] = res.data.data;
      setCategories(cats);

      const catIdParam = searchParams.get('categoryId');
      if (catIdParam) {
        setSelectedCategory(Number(catIdParam));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, unknown> = { page, size: 15 };
    if (selectedCategory) params.categoryId = selectedCategory;
    if (keyword) params.keyword = keyword;
    api.get('/posts', { params })
      .then((res) => {
        setPosts(res.data.data.content);
        setTotalPages(res.data.data.totalPages);
        setTotalElements(res.data.data.totalElements);
      })
      .finally(() => setLoading(false));
  }, [selectedCategory, page, keyword]);

  const handleCategoryChange = (id: number | null) => {
    setSelectedCategory(id);
    setPage(0);
    // URL도 업데이트
    if (id) {
      router.replace(`/posts?categoryId=${id}`, { scroll: false });
    } else {
      router.replace('/posts', { scroll: false });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(searchInput);
    setPage(0);
  };

  const selectedCategoryName = categories.find((c) => c.id === selectedCategory)?.name;

  return (
    <div className="bg-[#f4f6f8] min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {selectedCategoryName ? selectedCategoryName : '커뮤니티 게시판'}
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">총 {totalElements}개의 게시글</p>
            </div>
            {isLoggedIn && (
              <Link
                href="/posts/write"
                className="bg-[#003478] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-900 transition flex items-center gap-1"
              >
                ✏️ 글쓰기
              </Link>
            )}
          </div>

          {/* 카테고리 탭 */}
          <div className="flex gap-1 mt-4 overflow-x-auto pb-1">
            <button
              onClick={() => handleCategoryChange(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${!selectedCategory ? 'bg-[#003478] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              전체
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${selectedCategory === cat.id ? 'bg-[#003478] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-5">
        {/* 검색바 */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="검색어를 입력하세요"
              className="w-full border border-gray-300 bg-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478] focus:border-transparent pl-9"
            />
            <svg className="absolute left-3 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button type="submit" className="bg-[#003478] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-900 transition">
            검색
          </button>
        </form>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-2.5 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <span>제목</span>
            <span className="w-20 text-center">작성자</span>
            <span className="w-24 text-center">작성일</span>
            <span className="w-12 text-center">조회</span>
            <span className="w-12 text-center">좋아요</span>
          </div>

          {loading ? (
            <div className="divide-y divide-gray-50">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="px-5 py-4 flex gap-4 animate-pulse">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-50 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-gray-500 text-sm">게시글이 없습니다.</p>
              {isLoggedIn && (
                <Link href="/posts/write" className="inline-block mt-4 text-[#003478] text-sm font-medium hover:underline">
                  첫 글을 작성해보세요 →
                </Link>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {posts.map((post) => (
                <li key={post.id}>
                  <Link href={`/posts/${post.id}`} className="flex items-center px-5 py-3.5 hover:bg-blue-50/30 transition group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full shrink-0">{post.categoryName}</span>
                        <span className="font-medium text-gray-900 truncate group-hover:text-[#003478] transition text-sm">{post.title}</span>
                        {post.commentCount > 0 && (
                          <span className="text-xs text-red-500 font-semibold shrink-0">[{post.commentCount}]</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 md:hidden flex items-center gap-2">
                        <span>{post.authorNickname}</span>
                        <span>·</span>
                        <span>{formatDate(post.createdAt)}</span>
                        <span>·</span>
                        <span>조회 {post.viewCount}</span>
                      </div>
                    </div>
                    <div className="hidden md:flex items-center gap-4 shrink-0 text-xs text-gray-400">
                      <span className="w-20 text-center truncate">{post.authorNickname}</span>
                      <span className="w-24 text-center">{formatDate(post.createdAt)}</span>
                      <span className="w-12 text-center">{post.viewCount}</span>
                      <span className="w-12 text-center">❤ {post.likeCount}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-1 mt-5">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ‹ 이전
            </button>
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
              const pageNum = Math.max(0, Math.min(page - 4, totalPages - 10)) + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition ${page === pageNum ? 'bg-[#003478] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  {pageNum + 1}
                </button>
              );
            })}
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              다음 ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PostsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">불러오는 중...</div>}>
      <PostsContent />
    </Suspense>
  );
}
