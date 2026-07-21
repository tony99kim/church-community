'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCategoryStore } from '@/store/categoryStore';

const TYPE_ICON: Record<string, string> = {
  NOTICE: '📢',
  EVENT: '📅',
  COMMUNITY: '💬',
  LOCAL: '📍',
};

export default function Sidebar({ activeCategoryId }: { activeCategoryId?: string | null }) {
  const { isLoggedIn } = useAuthStore();
  const { categories, load } = useCategoryStore();

  useEffect(() => { load(); }, [load]);

  return (
    <aside className="w-64 shrink-0 hidden lg:block">
      <div className="sticky top-14 space-y-3">
        <div className="bg-white border border-[#EDEFF1] rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-[#003478] to-[#0056b3] h-10" />
          <div className="px-4 pt-3 pb-4">
            <div className="font-bold text-gray-900 text-sm">ChurchHub</div>
            <div className="text-xs text-gray-500 mt-0.5 mb-3">지역 청년 커뮤니티</div>
            {isLoggedIn && (
              <Link
                href="/posts/write"
                className="block w-full text-center bg-[#003478] text-white text-sm font-bold py-2 rounded-full hover:bg-[#002560] transition"
              >
                글쓰기
              </Link>
            )}
            {!isLoggedIn && (
              <Link
                href="/login"
                className="block w-full text-center border-2 border-[#003478] text-[#003478] text-sm font-bold py-2 rounded-full hover:bg-blue-50 transition"
              >
                로그인 / 가입
              </Link>
            )}
          </div>
        </div>

        <div className="bg-white border border-[#EDEFF1] rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[#EDEFF1]">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">게시판</span>
          </div>
          <ul className="py-1">
            <li>
              <Link
                href="/posts"
                className={`flex items-center gap-2.5 px-4 py-2 text-sm font-medium transition ${
                  !activeCategoryId ? 'text-[#003478] bg-blue-50' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>🏠</span>
                <span>전체 게시판</span>
              </Link>
            </li>
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/posts?categoryId=${cat.id}`}
                  className={`flex items-center gap-2.5 px-4 py-2 text-sm font-medium transition ${
                    activeCategoryId === String(cat.id) ? 'text-[#003478] bg-blue-50' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{TYPE_ICON[cat.type] ?? '📌'}</span>
                  <span>{cat.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
