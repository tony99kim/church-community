'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

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

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPosts = (p = 0, kw = keyword) => {
    setLoading(true);
    const params: Record<string, unknown> = { page: p, size: 15, sort: 'createdAt,desc' };
    if (kw) params.keyword = kw;
    api.get('/posts', { params })
      .then((res) => {
        setPosts(res.data.data.content);
        setTotalPages(res.data.data.totalPages);
        setTotalElements(res.data.data.totalElements);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPosts(page); }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(searchInput);
    setPage(0);
    fetchPosts(0, searchInput);
  };

  const handleDelete = async (post: Post) => {
    if (!confirm(`"${post.title}" 게시글을 삭제하시겠어요?`)) return;
    try {
      await api.delete(`/posts/${post.id}`);
      fetchPosts(page);
    } catch {
      alert('삭제에 실패했습니다.');
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">게시글 관리</h1>
          <p className="text-sm text-gray-500 mt-1">전체 게시글 {totalElements.toLocaleString()}개</p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-5">
        <div className="relative flex-1 max-w-sm">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="제목 검색"
            className="w-full border border-gray-300 bg-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478] pl-9"
          />
          <svg className="absolute left-3 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button type="submit" className="bg-[#003478] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-900 transition">
          검색
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-[1fr_100px_80px_80px_80px_80px] gap-3 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <span>제목</span>
          <span className="text-center">작성자</span>
          <span className="text-center">카테고리</span>
          <span className="text-center">조회</span>
          <span className="text-center">작성일</span>
          <span className="text-center">관리</span>
        </div>

        {loading ? (
          <div className="divide-y divide-gray-50">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="px-6 py-4 flex gap-4 animate-pulse">
                <div className="h-4 bg-gray-100 rounded flex-1" />
                <div className="h-4 bg-gray-100 rounded w-20" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">게시글이 없습니다.</div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {posts.map((post) => (
              <li key={post.id} className="grid grid-cols-[1fr_100px_80px_80px_80px_80px] gap-3 px-6 py-3.5 items-center hover:bg-gray-50 transition">
                <div className="min-w-0">
                  <Link
                    href={`/posts/${post.id}`}
                    target="_blank"
                    className="text-sm font-medium text-gray-900 hover:text-[#003478] truncate block"
                  >
                    {post.title}
                    {post.commentCount > 0 && (
                      <span className="text-xs text-red-400 ml-1">[{post.commentCount}]</span>
                    )}
                  </Link>
                </div>
                <div className="text-xs text-gray-500 text-center truncate">{post.authorNickname}</div>
                <div className="text-center">
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{post.categoryName}</span>
                </div>
                <div className="text-xs text-gray-400 text-center">{post.viewCount}</div>
                <div className="text-xs text-gray-400 text-center">
                  {new Date(post.createdAt).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={() => handleDelete(post)}
                    className="text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
                  >
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-1 mt-5">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30"
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
            className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30"
          >
            다음 ›
          </button>
        </div>
      )}
    </div>
  );
}
