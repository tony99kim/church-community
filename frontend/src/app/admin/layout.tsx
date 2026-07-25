'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { PendingCountsProvider, usePendingCounts } from '@/context/PendingCountsContext';

type NavLeaf = { href: string; label: string; icon: string; exact?: boolean; countKey?: string };
type NavGroup = { group: string; icon: string; basePath: string; children: NavLeaf[] };
type NavEntry = NavLeaf | NavGroup;

const navEntries: NavEntry[] = [
  { href: '/admin', label: '대시보드', icon: '📊', exact: true },
  { href: '/admin/churches', label: '교회 관리', icon: '⛪' },
  { href: '/admin/users', label: '회원 관리', icon: '👥' },
  {
    group: '커뮤니티', icon: '💬', basePath: '/admin/posts',
    children: [
      { href: '/admin/posts', label: '게시글 관리', icon: '📝' },
      { href: '/admin/categories', label: '카테고리 관리', icon: '📁' },
    ],
  },
  {
    group: '행사 관리', icon: '📅', basePath: '/admin/events',
    children: [
      { href: '/admin/events', label: '행사 관리', icon: '📅' },
      { href: '/admin/participants', label: '행사 참여자', icon: '🎫' },
    ],
  },
  { href: '/admin/spaces', label: '공간 대여 관리', icon: '🏠', countKey: 'spaceRentals' },
  { href: '/admin/items', label: '물품 대여 관리', icon: '📦', countKey: 'itemRentals' },
  { href: '/admin/welcome-kits', label: '웰컴 키트 신청', icon: '🎁', countKey: 'welcomeKits' },
  { href: '/admin/faith', label: '신앙 Q&A', icon: '✝️', countKey: 'faithQuestions' },
  { href: '/admin/service', label: '지역섬김 관리', icon: '🤝' },
  { href: '/admin/reports', label: '신고 관리', icon: '🚨' },
];

function NavLink({ item, indent = false }: { item: NavLeaf; indent?: boolean }) {
  const pathname = usePathname();
  const { counts } = usePendingCounts();
  const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
  const badge = item.countKey ? counts[item.countKey as keyof typeof counts] : 0;
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-xl text-sm font-medium transition ${
        indent ? 'px-3 py-2 ml-3' : 'px-3 py-2.5'
      } ${isActive ? 'bg-white/20 text-white' : 'text-blue-200 hover:bg-white/10 hover:text-white'}`}
    >
      <span className={indent ? 'text-xs' : ''}>{item.icon}</span>
      <span className="flex-1">{item.label}</span>
      {badge > 0 && (
        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
          {badge}
        </span>
      )}
    </Link>
  );
}

function NavGroupItem({ entry }: { entry: NavGroup }) {
  const pathname = usePathname();
  const isChildActive = entry.children.some(c => pathname.startsWith(c.href));
  const [open, setOpen] = useState(isChildActive);

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
          isChildActive ? 'bg-white/20 text-white' : 'text-blue-200 hover:bg-white/10 hover:text-white'
        }`}
      >
        <span>{entry.icon}</span>
        <span className="flex-1 text-left">{entry.group}</span>
        <span className={`text-[10px] transition-transform ${open ? 'rotate-90' : ''}`}>▶</span>
      </button>
      {open && (
        <div className="mt-0.5 space-y-0.5">
          {entry.children.map(child => <NavLink key={child.href} item={child} indent />)}
        </div>
      )}
    </div>
  );
}

function SidebarNav() {
  return (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {navEntries.map((entry) =>
        'group' in entry
          ? <NavGroupItem key={entry.group} entry={entry} />
          : <NavLink key={entry.href} item={entry} />
      )}
    </nav>
  );
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoggedIn, setUser, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken') ?? sessionStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }
    if (!isLoggedIn) {
      api.get('/users/me')
        .then((res) => {
          const u = res.data.data;
          setUser(u);
          if (u.role !== 'SUPER_ADMIN' && u.role !== 'CHURCH_MANAGER' && u.role !== 'PASTOR') router.push('/');
        })
        .catch(() => router.push('/login'));
    } else if (user && user.role !== 'SUPER_ADMIN' && user.role !== 'CHURCH_MANAGER' && user.role !== 'PASTOR') {
      router.push('/');
    }
  }, [isLoggedIn, user]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const roleLabel: Record<string, string> = {
    SUPER_ADMIN: '최고관리자',
    CHURCH_MANAGER: '교회관리자',
    PASTOR: '목사/전도사',
  };

  const SidebarContent = (
    <aside className="w-60 bg-[#003478] text-white flex flex-col h-full">
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

      <SidebarNav />

      <div className="px-5 py-4 border-t border-blue-900 shrink-0">
        <div className="text-xs text-blue-300 mb-0.5">{user?.nickname}</div>
        <div className="text-xs text-blue-400 mb-3">{roleLabel[user?.role ?? ''] ?? user?.role}</div>
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
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* 데스크탑 사이드바 */}
      <div className="hidden md:flex shrink-0">
        {SidebarContent}
      </div>

      {/* 모바일 사이드바 오버레이 */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="flex shrink-0">
            {SidebarContent}
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        {/* 모바일 상단 바 */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-[#003478] text-white shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="p-1">
            <div className="space-y-1">
              <div className="w-5 h-0.5 bg-white" />
              <div className="w-5 h-0.5 bg-white" />
              <div className="w-5 h-0.5 bg-white" />
            </div>
          </button>
          <span className="text-sm font-bold">ChurchHub 관리자</span>
        </div>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <PendingCountsProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </PendingCountsProvider>
  );
}
