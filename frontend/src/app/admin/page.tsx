'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { usePendingCounts } from '@/context/PendingCountsContext';

interface Dashboard {
  totalUsers: number;
  totalPosts: number;
  newUsersToday: number;
  newPostsToday: number;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const { counts } = usePendingCounts();

  useEffect(() => {
    api.get('/admin/dashboard')
      .then((res) => setData(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  const stats = data
    ? [
        { label: '전체 회원', value: data.totalUsers, icon: '👥', color: 'bg-blue-50 text-blue-600', border: 'border-blue-100' },
        { label: '전체 게시글', value: data.totalPosts, icon: '📝', color: 'bg-green-50 text-green-600', border: 'border-green-100' },
        { label: '오늘 신규 회원', value: data.newUsersToday, icon: '🆕', color: 'bg-purple-50 text-purple-600', border: 'border-purple-100' },
        { label: '오늘 게시글', value: data.newPostsToday, icon: '✍️', color: 'bg-orange-50 text-orange-600', border: 'border-orange-100' },
      ]
    : [];

  const pending = [
    { label: '공간 대여 승인 대기', value: counts.spaceRentals, href: '/admin/spaces', color: 'bg-amber-50 border-amber-200 text-amber-700', dot: 'bg-amber-400' },
    { label: '물품 대여 승인 대기', value: counts.itemRentals, href: '/admin/items', color: 'bg-orange-50 border-orange-200 text-orange-700', dot: 'bg-orange-400' },
    { label: '웰컴 키트 미처리', value: counts.welcomeKits, href: '/admin/welcome-kits', color: 'bg-rose-50 border-rose-200 text-rose-700', dot: 'bg-rose-400' },
    { label: '미답변 신앙 질문', value: counts.faithQuestions, href: '/admin/faith', color: 'bg-violet-50 border-violet-200 text-violet-700', dot: 'bg-violet-400' },
  ];

  const totalPending = counts.spaceRentals + counts.itemRentals + counts.welcomeKits + counts.faithQuestions;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-500 text-sm mt-1">ChurchHub 커뮤니티 현황을 확인하세요</p>
      </div>

      {/* 통계 카드 */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
              <div className="h-8 bg-gray-100 rounded w-16 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-24" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
            <div key={s.label} className={`bg-white rounded-2xl border ${s.border} p-6`}>
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-xl ${s.color} mb-3`}>
                {s.icon}
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{s.value.toLocaleString()}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* 처리 대기 현황 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">처리 대기 현황</h2>
          {totalPending > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              총 {totalPending}건
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {pending.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className={`flex items-center gap-3 p-4 rounded-xl border ${p.color} transition hover:opacity-80`}
            >
              <div className={`w-2 h-2 rounded-full shrink-0 ${p.dot} ${p.value === 0 ? 'opacity-30' : ''}`} />
              <div className="min-w-0">
                <div className="text-2xl font-bold leading-none mb-1">{p.value}</div>
                <div className="text-xs opacity-80 leading-tight">{p.label}</div>
              </div>
            </Link>
          ))}
        </div>
        {totalPending === 0 && (
          <p className="text-center text-sm text-gray-400 mt-3">처리 대기 항목이 없습니다 ✓</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 빠른 메뉴 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-4">빠른 메뉴</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: '/admin/users', label: '회원 관리', icon: '👥', desc: '회원 조회 및 권한/상태 관리' },
              { href: '/admin/spaces', label: '공간 대여', icon: '🏠', desc: '공간 등록 및 대여 승인' },
              { href: '/admin/items', label: '물품 대여', icon: '📦', desc: '물품 등록 및 대여 승인' },
              { href: '/admin/welcome-kits', label: '웰컴 키트', icon: '🎁', desc: '신청 목록 및 메시지 전송' },
              { href: '/admin/faith', label: '신앙 Q&A', icon: '✝️', desc: '질문 답변 및 기도 요청' },
              { href: '/admin/events', label: '행사 관리', icon: '📅', desc: '행사 등록 및 상태 관리' },
              { href: '/admin/posts', label: '게시글 관리', icon: '📝', desc: '게시글 조회 및 삭제' },
              { href: '/', label: '사이트 바로가기', icon: '🌐', desc: '커뮤니티 사이트 확인' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col p-4 bg-gray-50 rounded-xl hover:bg-blue-50 hover:border-blue-100 border border-transparent transition"
              >
                <span className="text-2xl mb-2">{item.icon}</span>
                <span className="text-sm font-semibold text-gray-900">{item.label}</span>
                <span className="text-xs text-gray-400 mt-0.5">{item.desc}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* 시스템 정보 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-4">시스템 정보</h2>
          <dl className="space-y-3">
            {[
              { label: '백엔드', value: 'Spring Boot 3.2.5 (Java 21)' },
              { label: '프론트엔드', value: 'Next.js 14 (Vercel)' },
              { label: '데이터베이스', value: 'PostgreSQL (Supabase)' },
              { label: '캐시', value: 'Redis (Upstash)' },
              { label: '파일 스토리지', value: 'Supabase Storage' },
              { label: '서버', value: 'Fly.io' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50">
                <dt className="text-sm text-gray-500">{item.label}</dt>
                <dd className="text-sm font-medium text-gray-900">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
