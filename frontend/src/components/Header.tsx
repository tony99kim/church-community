'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useEffect, useRef, useState } from 'react';

export default function Header() {
  const { user, isLoggedIn, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#EDEFF1] shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-12 flex items-center gap-4">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-1.5 shrink-0">
          <div className="w-7 h-7 bg-[#003478] rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">C</span>
          </div>
          <span className="font-bold text-[#003478] text-sm hidden sm:block">ChurchHub</span>
        </Link>

        {/* 네비게이션 */}
        <nav className="hidden md:flex items-center gap-1 ml-2">
          <Link href="/" className="text-sm text-gray-600 hover:text-[#003478] font-medium px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
            홈
          </Link>
          <Link href="/posts" className="text-sm text-gray-600 hover:text-[#003478] font-medium px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
            게시판
          </Link>
          <Link href="/events" className="text-sm text-gray-600 hover:text-[#003478] font-medium px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
            행사
          </Link>
        </nav>

        <div className="flex-1" />

        {/* 우측 액션 */}
        {isLoggedIn ? (
          <div className="flex items-center gap-2">
            <Link
              href="/posts/write"
              className="hidden sm:flex items-center bg-[#003478] text-white text-xs font-bold px-4 py-1.5 rounded-full hover:bg-[#002560] transition"
            >
              + 글쓰기
            </Link>
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-1.5"
              >
                <div className="w-7 h-7 bg-[#003478] rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {user?.nickname?.[0]}
                </div>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-9 bg-white border border-[#EDEFF1] rounded-xl shadow-lg py-1 w-40 z-50">
                  <div className="px-4 py-2 border-b border-[#EDEFF1]">
                    <div className="text-xs font-bold text-gray-900 truncate">{user?.nickname}</div>
                    <div className="text-xs text-gray-400 truncate">{user?.email}</div>
                  </div>
                  <Link href="/my" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                    내 정보
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                      관리자 패널
                    </Link>
                  )}
                  <button
                    onClick={() => { logout(); setUserMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50"
                  >
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm text-[#003478] font-bold border-2 border-[#003478] px-4 py-1 rounded-full hover:bg-blue-50 transition">
              로그인
            </Link>
            <Link href="/register" className="hidden sm:block text-sm text-white bg-[#003478] font-bold px-4 py-1 rounded-full hover:bg-[#002560] transition">
              회원가입
            </Link>
          </div>
        )}

        {/* 모바일 햄버거 */}
        <button
          className="md:hidden p-1.5 text-gray-600"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="메뉴"
        >
          <div className="space-y-1">
            <div className={`w-5 h-0.5 bg-current transition-transform ${menuOpen ? 'translate-y-1.5 rotate-45' : ''}`} />
            <div className={`w-5 h-0.5 bg-current transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
            <div className={`w-5 h-0.5 bg-current transition-transform ${menuOpen ? '-translate-y-1.5 -rotate-45' : ''}`} />
          </div>
        </button>
      </div>

      {/* 모바일 드롭다운 */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-[#EDEFF1] px-4 py-3 space-y-1">
          <Link href="/" className="block py-2 text-sm font-medium text-gray-700 hover:text-[#003478]" onClick={() => setMenuOpen(false)}>홈</Link>
          <Link href="/posts" className="block py-2 text-sm font-medium text-gray-700 hover:text-[#003478]" onClick={() => setMenuOpen(false)}>게시판</Link>
          <Link href="/events" className="block py-2 text-sm font-medium text-gray-700 hover:text-[#003478]" onClick={() => setMenuOpen(false)}>행사</Link>
          {isLoggedIn ? (
            <>
              <Link href="/posts/write" className="block py-2 text-sm font-medium text-[#003478]" onClick={() => setMenuOpen(false)}>+ 글쓰기</Link>
              <Link href="/my" className="block py-2 text-sm font-medium text-gray-700 hover:text-[#003478]" onClick={() => setMenuOpen(false)}>내 정보</Link>
              {isAdmin && <Link href="/admin" className="block py-2 text-sm font-medium text-gray-700 hover:text-[#003478]" onClick={() => setMenuOpen(false)}>관리자</Link>}
              <button onClick={() => { logout(); setMenuOpen(false); }} className="block py-2 text-sm font-medium text-red-500 w-full text-left">로그아웃</button>
            </>
          ) : (
            <>
              <Link href="/login" className="block py-2 text-sm font-medium text-[#003478]" onClick={() => setMenuOpen(false)}>로그인</Link>
              <Link href="/register" className="block py-2 text-sm font-medium text-gray-700 hover:text-[#003478]" onClick={() => setMenuOpen(false)}>회원가입</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
