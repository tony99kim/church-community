'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

const navItems = [
  { href: '/admin', label: '대시보드', icon: '📊' },
  { href: '/admin/categories', label: '카테고리 관리', icon: '📁' },
  { href: '/admin/users', label: '회원 관리', icon: '👥' },
  { href: '/admin/posts', label: '게시글 관리', icon: '📝' },
  { href: '/admin/events', label: '행사 관리', icon: '📅' },
  { href: '/admin/participants', label: '행사 참여자', icon: '🎫' },
  { href: '/admin/reports', label: '신고 관리', icon: '🚨' },
  { href: '/admin/churches', label: '교회 관리', icon: '⛪' },
  { href: '/admin/spaces', label: '공간 대여 관리', icon: '🏠' },
  { href: '/admin/items', label: '물품 대여 관리', icon: '📦' },
  { href: '/admin/welcome-kits', label: '웰컴 키트 신청', icon: '🎁' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoggedIn, setUser, logout } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }
    if (!isLoggedIn) {
      api.get('/users/me')
        .then((res) => {
          const u = res.data.data;
          setUser(u);
          if (u.role !== 'ADMIN' && u.role !== 'SUPER_ADMIN') router.push('/');
        })
        .catch(() => router.push('/login'));
    } else if (user && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      router.push('/');
    }
  }, [isLoggedIn, user]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* 사이드바 */}
      <aside className="w-60 bg-[#003478] text-white flex flex-col shrink-0">
        <div className="px-5 py-6 border-b border-blue-900">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-[#003478] text-sm font-bold">C</span>
            </div>
            <div>
              <div className="text-sm font-bold leading-tight">ChurchHub</div>
              <div className="text-xs text-blue-300 leading-tight">관리자</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'text-blue-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-blue-900">
          <div className="text-xs text-blue-300 mb-1">{user?.nickname}</div>
          <div className="text-xs text-blue-400 mb-3">{user?.role}</div>
          <div className="flex gap-2">
            <Link href="/" className="flex-1 text-center text-xs text-blue-300 hover:text-white border border-blue-700 rounded-lg py-1.5 transition">
              사이트
            </Link>
            <button onClick={handleLogout} className="flex-1 text-xs text-blue-300 hover:text-white border border-blue-700 rounded-lg py-1.5 transition">
              로그아웃
            </button>
          </div>
        </div>
      </aside>

      {/* 메인 */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
