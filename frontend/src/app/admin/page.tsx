'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Dashboard {
  totalUsers: number;
  totalPosts: number;
  newUsersToday: number;
  newPostsToday: number;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-500 text-sm mt-1">ChurchHub 커뮤니티 현황을 확인하세요</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-4">빠른 메뉴</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: '/admin/categories', label: '카테고리 관리', icon: '📁', desc: '게시판 카테고리 추가/수정/삭제' },
              { href: '/admin/users', label: '회원 관리', icon: '👥', desc: '회원 목록 조회 및 상태 관리' },
              { href: '/admin/posts', label: '게시글 관리', icon: '📝', desc: '게시글 목록 조회 및 삭제' },
              { href: '/', label: '사이트 바로가기', icon: '🌐', desc: '커뮤니티 사이트 확인' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="flex flex-col p-4 bg-gray-50 rounded-xl hover:bg-blue-50 hover:border-blue-100 border border-transparent transition"
              >
                <span className="text-2xl mb-2">{item.icon}</span>
                <span className="text-sm font-semibold text-gray-900">{item.label}</span>
                <span className="text-xs text-gray-400 mt-0.5">{item.desc}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-4">시스템 정보</h2>
          <dl className="space-y-3">
            {[
              { label: '백엔드', value: 'Spring Boot 3.2.5' },
              { label: '데이터베이스', value: 'PostgreSQL (Supabase)' },
              { label: '캐시', value: 'Redis (Upstash)' },
              { label: '서버', value: 'Render (Free)' },
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
