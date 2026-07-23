'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useEffect, useRef, useState, useCallback } from 'react';
import api from '@/lib/api';
import type { Notification } from '@/types';
import { formatDate } from '@/lib/utils';

const RELATED_PATH: Record<string, (id: number) => string> = {
  POST: (id) => `/posts/${id}`,
  COMMENT: (id) => `/posts/${id}`,
  EVENT: (id) => `/events/${id}`,
};

export default function Header() {
  const { user, isLoggedIn, logout } = useAuthStore();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notiRef = useRef<HTMLDivElement>(null);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const fetchUnread = useCallback(() => {
    if (!isLoggedIn) return;
    api.get('/notifications/unread-count').then((r) => setUnreadCount(r.data.data.count));
  }, [isLoggedIn]);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  const openNoti = () => {
    if (!notiOpen) {
      api.get('/notifications').then((r) => setNotifications(r.data.data));
    }
    setNotiOpen(!notiOpen);
    setUserMenuOpen(false);
  };

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotiClick = async (n: Notification) => {
    if (!n.read) {
      await api.put(`/notifications/${n.id}/read`);
      setUnreadCount((c) => Math.max(0, c - 1));
      setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x));
    }
    setNotiOpen(false);
    if (n.relatedId && n.relatedType) {
      router.push(RELATED_PATH[n.relatedType](n.relatedId));
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notiRef.current && !notiRef.current.contains(e.target as Node)) {
        setNotiOpen(false);
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
          <Link href="/welcome" className="text-sm text-gray-600 hover:text-[#003478] font-medium px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">처음 오셨나요?</Link>
          <Link href="/churches" className="text-sm text-gray-600 hover:text-[#003478] font-medium px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">함께하는 교회</Link>
          <Link href="/events" className="text-sm text-gray-600 hover:text-[#003478] font-medium px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">행사 안내</Link>
          <Link href="/community" className="text-sm text-gray-600 hover:text-[#003478] font-medium px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">커뮤니티</Link>
          <Link href="/spaces" className="text-sm text-gray-600 hover:text-[#003478] font-medium px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">공간 대여</Link>
          <Link href="/items" className="text-sm text-gray-600 hover:text-[#003478] font-medium px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">물품 대여</Link>
          <Link href="/faith" className="text-sm text-gray-600 hover:text-[#003478] font-medium px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">신앙 Q&A</Link>
          <Link href="/service" className="text-sm text-gray-600 hover:text-[#003478] font-medium px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">지역 섬김</Link>
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

            {/* 알림 벨 */}
            <div className="relative" ref={notiRef}>
              <button onClick={openNoti} className="relative p-1.5 text-gray-500 hover:text-[#003478] transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notiOpen && (
                <div className="absolute right-0 top-9 w-80 bg-white border border-[#EDEFF1] rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#EDEFF1]">
                    <span className="text-sm font-bold text-gray-900">알림</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-[#003478] hover:underline">
                        모두 읽음
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-gray-400">알림이 없습니다</div>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => handleNotiClick(n)}
                          className={`w-full text-left px-4 py-3 border-b border-[#EDEFF1] hover:bg-gray-50 transition ${!n.read ? 'bg-blue-50/50' : ''}`}
                        >
                          <p className="text-xs text-gray-800 leading-relaxed">{n.content}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{formatDate(n.createdAt)}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

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
          <Link href="/welcome" className="block py-2 text-sm font-medium text-gray-700 hover:text-[#003478]" onClick={() => setMenuOpen(false)}>처음 오셨나요?</Link>
          <Link href="/churches" className="block py-2 text-sm font-medium text-gray-700 hover:text-[#003478]" onClick={() => setMenuOpen(false)}>함께하는 교회</Link>
          <Link href="/events" className="block py-2 text-sm font-medium text-gray-700 hover:text-[#003478]" onClick={() => setMenuOpen(false)}>행사 안내</Link>
          <Link href="/community" className="block py-2 text-sm font-medium text-gray-700 hover:text-[#003478]" onClick={() => setMenuOpen(false)}>커뮤니티</Link>
          <Link href="/spaces" className="block py-2 text-sm font-medium text-gray-700 hover:text-[#003478]" onClick={() => setMenuOpen(false)}>공간 대여</Link>
          <Link href="/items" className="block py-2 text-sm font-medium text-gray-700 hover:text-[#003478]" onClick={() => setMenuOpen(false)}>물품 대여</Link>
          <Link href="/faith" className="block py-2 text-sm font-medium text-gray-700 hover:text-[#003478]" onClick={() => setMenuOpen(false)}>신앙 Q&A</Link>
          <Link href="/service" className="block py-2 text-sm font-medium text-gray-700 hover:text-[#003478]" onClick={() => setMenuOpen(false)}>지역 섬김</Link>
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
