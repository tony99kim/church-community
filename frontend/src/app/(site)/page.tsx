'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import RecentPosts from '@/components/RecentPosts';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

interface Category {
  id: number;
  name: string;
  type: string;
}

const TYPE_ICON: Record<string, string> = {
  NOTICE: '📢',
  EVENT: '📅',
  COMMUNITY: '💬',
  LOCAL: '📍',
};

const TYPE_COLOR: Record<string, string> = {
  NOTICE: 'bg-blue-50 text-blue-600 border-blue-100',
  EVENT: 'bg-green-50 text-green-600 border-green-100',
  COMMUNITY: 'bg-orange-50 text-orange-600 border-orange-100',
  LOCAL: 'bg-yellow-50 text-yellow-600 border-yellow-100',
};

export default function Home() {
  const { isLoggedIn, user } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalPosts, setTotalPosts] = useState(0);

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.data)).catch(() => {});
    api.get('/posts', { params: { page: 0, size: 1 } })
      .then((res) => setTotalPosts(res.data.data.totalElements))
      .catch(() => {});
  }, []);

  return (
    <div className="bg-[#f4f6f8] min-h-screen">
      {/* 히어로 배너 */}
      <div className="bg-gradient-to-r from-[#003478] to-[#0056b3] text-white">
        <div className="max-w-6xl mx-auto px-4 py-14 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <div className="inline-block bg-white/20 text-white text-xs px-3 py-1 rounded-full mb-4">
              🏠 우리 지역 청년 모임
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
              함께 나누는<br />청년 커뮤니티
            </h1>
            <p className="text-blue-100 mb-6 text-sm leading-relaxed">
              교회 소식, 지역 행사, 청년들의 이야기를<br />
              자유롭게 나눠보세요.
            </p>
            <div className="flex gap-3">
              <Link href="/posts" className="bg-white text-[#003478] px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-50 transition">
                게시판 바로가기
              </Link>
              {isLoggedIn ? (
                <Link href="/posts/write" className="border border-white/50 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-white/10 transition">
                  ✏️ 글쓰기
                </Link>
              ) : (
                <Link href="/register" className="border border-white/50 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-white/10 transition">
                  회원가입
                </Link>
              )}
            </div>
          </div>
          <div className="hidden md:flex flex-col gap-3 text-sm">
            {categories.slice(0, 3).map((cat) => (
              <Link
                key={cat.id}
                href={`/posts?categoryId=${cat.id}`}
                className="bg-white/10 backdrop-blur rounded-xl px-5 py-3 flex items-center gap-3 w-56 hover:bg-white/20 transition"
              >
                <span className="text-2xl">{TYPE_ICON[cat.type] ?? '📋'}</span>
                <div>
                  <div className="font-semibold">{cat.name}</div>
                  <div className="text-blue-200 text-xs">게시판 바로가기</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 카테고리 바로가기 - API에서 동적 로드 */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {categories.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categories.slice(0, 8).map((cat) => (
              <Link
                key={cat.id}
                href={`/posts?categoryId=${cat.id}`}
                className={`flex items-center gap-3 bg-white rounded-xl p-4 border hover:shadow-md transition ${TYPE_COLOR[cat.type] ?? 'bg-gray-50 text-gray-600 border-gray-100'}`}
              >
                <span className="text-2xl">{TYPE_ICON[cat.type] ?? '📋'}</span>
                <span className="font-medium text-sm">{cat.name}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-white rounded-xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        )}
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-6xl mx-auto px-4 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <RecentPosts />
          </div>

          {/* 사이드바 */}
          <div className="space-y-4">
            {/* 로그인 상태에 따른 카드 */}
            {isLoggedIn ? (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#003478] rounded-full flex items-center justify-center text-white font-bold">
                    {user?.nickname?.[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{user?.nickname}</div>
                    <div className="text-xs text-gray-400">
                      {user?.role === 'SUPER_ADMIN' ? '최고관리자' : user?.role === 'ADMIN' ? '관리자' : '일반회원'}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/my" className="text-center text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded-lg transition font-medium">
                    내 정보
                  </Link>
                  <Link href="/posts/write" className="text-center text-xs bg-[#003478] hover:bg-blue-900 text-white py-2 rounded-lg transition font-medium">
                    글쓰기
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-[#003478] to-[#0056b3] rounded-xl p-5 text-white">
                <h3 className="font-bold mb-2">🎉 지금 가입하세요!</h3>
                <p className="text-blue-100 text-sm mb-4">회원이 되면 글쓰기, 댓글, 좋아요 등 모든 기능을 이용할 수 있어요.</p>
                <Link href="/register" className="block bg-white text-[#003478] text-center text-sm font-semibold py-2 rounded-lg hover:bg-blue-50 transition">
                  무료 회원가입
                </Link>
              </div>
            )}

            {/* 카테고리 목록 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-bold text-gray-900 mb-3">📁 게시판 목록</h3>
              {categories.length === 0 ? (
                <p className="text-sm text-gray-400">카테고리가 없습니다.</p>
              ) : (
                <ul className="space-y-1">
                  <li>
                    <Link href="/posts" className="flex items-center justify-between py-1.5 text-sm text-gray-700 hover:text-[#003478] transition">
                      <span>전체 게시글</span>
                      <span className="text-xs text-gray-400">{totalPosts}</span>
                    </Link>
                  </li>
                  {categories.map((cat) => (
                    <li key={cat.id}>
                      <Link
                        href={`/posts?categoryId=${cat.id}`}
                        className="flex items-center justify-between py-1.5 text-sm text-gray-700 hover:text-[#003478] transition"
                      >
                        <span className="flex items-center gap-1.5">
                          <span className="text-sm">{TYPE_ICON[cat.type] ?? '📋'}</span>
                          {cat.name}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 통계 */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-bold text-gray-900 mb-3">📊 커뮤니티 현황</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-[#003478]">{totalPosts}</div>
                  <div className="text-xs text-gray-500">전체 게시글</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-[#003478]">{categories.length}</div>
                  <div className="text-xs text-gray-500">게시판 수</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
