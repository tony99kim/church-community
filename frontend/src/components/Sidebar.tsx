'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCategoryStore } from '@/store/categoryStore';
import type { Category } from '@/types';

const TYPE_ICON: Record<string, string> = {
  NOTICE: '📢',
  EVENT: '📅',
  COMMUNITY: '💬',
  LOCAL: '📍',
};

export default function Sidebar({ activeCategoryId }: { activeCategoryId?: string | null }) {
  const { isLoggedIn } = useAuthStore();
  const { categories, load } = useCategoryStore();
  const [expandedLocals, setExpandedLocals] = useState<Set<number>>(new Set());

  useEffect(() => { load(); }, [load]);

  // 최상위(parent 없는) 카테고리만
  const rootCategories = categories.filter((c) => !c.parentId);
  const nonLocal = rootCategories.filter((c) => c.type !== 'LOCAL');
  const localRoots = rootCategories.filter((c) => c.type === 'LOCAL');

  const toggleLocal = (id: number) => {
    setExpandedLocals((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // 활성 카테고리가 LOCAL 자식이면 부모 자동 펼침
  useEffect(() => {
    if (!activeCategoryId) return;
    const active = categories.find((c) => String(c.id) === activeCategoryId);
    if (active?.parentId) {
      setExpandedLocals((prev) => new Set([...prev, active.parentId!]));
    }
  }, [activeCategoryId, categories]);

  const getChildren = (parentId: number): Category[] =>
    categories.filter((c) => c.parentId === parentId);

  return (
    <aside className="w-64 shrink-0 hidden lg:block">
      <div className="sticky top-14 space-y-3">
        <div className="bg-white border border-[#EDEFF1] rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-[#003478] to-[#0056b3] h-10" />
          <div className="px-4 pt-3 pb-4">
            <div className="font-bold text-gray-900 text-sm">ChurchHub</div>
            <div className="text-xs text-gray-500 mt-0.5 mb-3">지역 청년 커뮤니티</div>
            {isLoggedIn ? (
              <Link
                href="/posts/write"
                className="block w-full text-center bg-[#003478] text-white text-sm font-bold py-2 rounded-full hover:bg-[#002560] transition"
              >
                글쓰기
              </Link>
            ) : (
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
            {nonLocal.map((cat) => (
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

        {localRoots.length > 0 && (
          <div className="bg-white border border-[#EDEFF1] rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[#EDEFF1]">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">지역 게시판</span>
            </div>
            <ul className="py-1">
              {localRoots.map((region) => {
                const children = getChildren(region.id);
                const isExpanded = expandedLocals.has(region.id);
                const isRegionActive = activeCategoryId === String(region.id);

                return (
                  <li key={region.id}>
                    {/* 시도 헤더 */}
                    <div className="flex items-center">
                      <Link
                        href={`/posts?categoryId=${region.id}`}
                        className={`flex-1 flex items-center gap-2 px-4 py-2 text-sm font-medium transition ${
                          isRegionActive ? 'text-[#003478] bg-blue-50' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span>📍</span>
                        <span>{region.name}</span>
                      </Link>
                      {children.length > 0 && (
                        <button
                          onClick={() => toggleLocal(region.id)}
                          className="px-2 py-2 text-gray-400 hover:text-gray-600 transition text-xs"
                        >
                          {isExpanded ? '▲' : '▼'}
                        </button>
                      )}
                    </div>

                    {/* 구 목록 */}
                    {isExpanded && children.length > 0 && (
                      <ul className="bg-gray-50">
                        {children.map((child) => (
                          <li key={child.id}>
                            <Link
                              href={`/posts?categoryId=${child.id}`}
                              className={`flex items-center gap-2 pl-10 pr-4 py-1.5 text-xs font-medium transition ${
                                activeCategoryId === String(child.id)
                                  ? 'text-[#003478] bg-blue-50'
                                  : 'text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              <span className="text-gray-300">└</span>
                              <span>{child.name}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
}
