'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Category {
  id: number;
  name: string;
  type: string;
}

export default function Header() {
  const { user, isLoggedIn, setUser, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token && !isLoggedIn) {
      api.get('/users/me').then((res) => setUser(res.data.data)).catch(() => {});
    }
    api.get('/categories').then((res) => setCategories(res.data.data)).catch(() => {});
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      {/* 상단 띠 */}
      <div className="bg-[#003478] text-white text-xs py-1.5 px-4 flex justify-end gap-4">
        {isLoggedIn ? (
          <>
            <Link href="/my" className="text-gray-300 hover:text-white transition">{user?.nickname}님</Link>
            <button onClick={logout} className="hover:text-yellow-300 transition">로그아웃</button>
            {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
              <Link href="/admin" className="hover:text-yellow-300 transition">관리자</Link>
            )}
          </>
        ) : (
          <>
            <Link href="/login" className="hover:text-yellow-300 transition">로그인</Link>
            <Link href="/register" className="hover:text-yellow-300 transition">회원가입</Link>
          </>
        )}
      </div>

      {/* 메인 헤더 */}
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-[#003478] rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">C</span>
          </div>
          <div>
            <div className="text-lg font-bold text-[#003478] leading-tight">ChurchHub</div>
            <div className="text-xs text-gray-400 leading-tight">지역 청년 커뮤니티</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link href="/" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#003478] hover:bg-blue-50 rounded-lg transition">
            홈
          </Link>
          <Link href="/posts" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#003478] hover:bg-blue-50 rounded-lg transition">
            전체 게시판
          </Link>
          {/* 카테고리 API에서 동적 로드 (최대 4개) */}
          {categories.slice(0, 4).map((cat) => (
            <Link
              key={cat.id}
              href={`/posts?categoryId=${cat.id}`}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#003478] hover:bg-blue-50 rounded-lg transition"
            >
              {cat.name}
            </Link>
          ))}
        </nav>

        {isLoggedIn && (
          <Link
            href="/posts/write"
            className="hidden md:flex bg-[#003478] text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-800 transition items-center gap-1 shrink-0"
          >
            ✏️ 글쓰기
          </Link>
        )}

        {/* 모바일 메뉴 버튼 */}
        <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
          <div className="w-5 h-0.5 bg-gray-600 mb-1" />
          <div className="w-5 h-0.5 bg-gray-600 mb-1" />
          <div className="w-5 h-0.5 bg-gray-600" />
        </button>
      </div>

      {/* 모바일 드롭다운 */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-1">
          <Link href="/" className="block py-2 text-sm text-gray-700 hover:text-[#003478]" onClick={() => setMenuOpen(false)}>홈</Link>
          <Link href="/posts" className="block py-2 text-sm text-gray-700 hover:text-[#003478]" onClick={() => setMenuOpen(false)}>전체 게시판</Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/posts?categoryId=${cat.id}`}
              className="block py-2 text-sm text-gray-700 hover:text-[#003478]"
              onClick={() => setMenuOpen(false)}
            >
              {cat.name}
            </Link>
          ))}
          {isLoggedIn && (
            <Link href="/posts/write" className="block py-2 text-sm text-blue-600 font-medium" onClick={() => setMenuOpen(false)}>
              ✏️ 글쓰기
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
