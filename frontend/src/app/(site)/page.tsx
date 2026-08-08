'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Church, Event, Post } from '@/types';
import { useAuthStore } from '@/store/authStore';

export default function HomePage() {
  const [churches, setChurches] = useState<Church[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);
  const [welcomeEvent, setWelcomeEvent] = useState<Event | null>(null);
  const [loaded, setLoaded] = useState(false);
  const { user, isLoggedIn } = useAuthStore();

  useEffect(() => {
    Promise.all([
      api.get('/churches').then(r => setChurches(r.data.data?.slice(0, 4) ?? [])).catch(() => {}),
      api.get('/events?size=3&sort=startDate,asc').then(r => setUpcomingEvents(r.data.data?.content ?? [])).catch(() => {}),
      api.get('/posts?size=5&sort=likeCount,desc').then(r => setPopularPosts(r.data.data?.content ?? [])).catch(() => {}),
      api.get('/events?category=WELCOME_TABLE&size=1&sort=startDate,asc').then(r => setWelcomeEvent(r.data.data?.content?.[0] ?? null)).catch(() => {}),
    ]).finally(() => setLoaded(true));
  }, []);

  return (
    <main className="min-h-screen bg-[#f4f6f8]">
      {/* 히어로 */}
      <section className="bg-[#003478] text-white py-20 px-4 text-center">
        {isLoggedIn && user ? (
          <p className="text-blue-300 text-sm mb-2">안녕하세요, {user.nickname}님 👋</p>
        ) : null}
        <h1 className="text-3xl md:text-5xl font-bold mb-4">염리동 청년 커뮤니티</h1>
        <p className="text-lg md:text-xl text-blue-200 mb-8">
          염리동 12개 교회 청년들이 함께 만들어가는 따뜻한 동네 공동체
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/welcome" className="px-6 py-3 bg-white text-[#003478] font-semibold rounded-lg hover:bg-blue-50 transition-colors">
            처음 오셨나요? →
          </Link>
          <Link href="/events" className="px-6 py-3 border border-white text-white rounded-lg hover:bg-white/10 transition-colors">
            행사 안내 보기
          </Link>
        </div>
      </section>

      {/* 웰컴 테이블 강조 배너 — 실제 행사 있을 때만 표시 */}
      {welcomeEvent && (
        <section className="bg-amber-50 border-b border-amber-200 py-6 px-4">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm text-amber-600 font-semibold mb-1">🍽 웰컴 테이블</p>
              <h2 className="text-xl font-bold text-gray-800">{welcomeEvent.title}</h2>
              <p className="text-gray-600 text-sm mt-1">
                📍 {welcomeEvent.location} · {new Date(welcomeEvent.startDate).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
              </p>
            </div>
            <Link href={`/events/${welcomeEvent.id}`} className="shrink-0 px-5 py-2.5 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors">
              참가 신청하기
            </Link>
          </div>
        </section>
      )}

      {/* 빠른 메뉴 */}
      <section className="max-w-5xl mx-auto py-12 px-4">
        <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">무엇을 찾고 계신가요?</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { href: '/welcome', label: '처음 오셨나요?', emoji: '👋', desc: '웰컴 키트 · 동네 가이드' },
            { href: '/churches', label: '함께하는 교회', emoji: '⛪', desc: '염리동 12개 교회 소개' },
            { href: '/spaces', label: '공간 대여', emoji: '🏠', desc: '교회 공간 무료 대여' },
            { href: '/items', label: '물품 대여', emoji: '📦', desc: '이사·청소·행사 물품' },
            { href: '/faith', label: '신앙 Q&A', emoji: '✝️', desc: '신앙 질문 · 기도 요청' },
            { href: '/community', label: '커뮤니티', emoji: '💬', desc: '자유게시판 · 소모임 모집' },
            { href: '/events', label: '행사 안내', emoji: '📅', desc: '동네 · 신앙 · 섬김 모임' },
            { href: '/service', label: '지역 섬김', emoji: '🤝', desc: '봉사 · 복지관 연계' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="p-4 bg-white rounded-xl border border-[#EDEFF1] hover:border-[#003478] hover:shadow-sm transition-all text-center">
              <div className="text-2xl mb-2">{item.emoji}</div>
              <div className="font-semibold text-sm text-gray-800">{item.label}</div>
              <div className="text-xs text-gray-500 mt-1">{item.desc}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* 다가오는 행사 */}
      <section className="max-w-5xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">다가오는 행사</h2>
          <Link href="/events" className="text-sm text-[#003478] hover:underline">전체 보기 →</Link>
        </div>
        {!loaded ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-[#EDEFF1] p-4 animate-pulse">
                <div className="h-28 bg-gray-100 rounded-lg mb-3" />
                <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-50 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : upcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {upcomingEvents.map(e => (
              <Link key={e.id} href={`/events/${e.id}`} className="p-4 bg-white rounded-xl border border-[#EDEFF1] hover:border-[#003478] hover:shadow-sm transition-all">
                {e.thumbnailUrl && (
                  <div className="w-full h-28 rounded-lg overflow-hidden mb-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={e.thumbnailUrl} alt={e.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="font-semibold text-sm text-gray-800 truncate">{e.title}</div>
                <div className="text-xs text-gray-500 mt-1">
                  📍 {e.location} · {new Date(e.startDate).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      {/* 인기글 */}
      {popularPosts.length > 0 && (
        <section className="max-w-5xl mx-auto py-8 px-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">인기글 🔥</h2>
            <Link href="/community" className="text-sm text-[#003478] hover:underline">더 보기 →</Link>
          </div>
          <div className="bg-white rounded-xl border border-[#EDEFF1] divide-y divide-[#EDEFF1]">
            {popularPosts.map((post, idx) => (
              <Link key={post.id} href={`/posts/${post.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                <span className={`text-lg font-bold w-6 text-center shrink-0 ${idx === 0 ? 'text-[#003478]' : 'text-gray-300'}`}>
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="text-sm font-medium text-gray-800 truncate">{post.title}</span>
                    {post.commentCount > 0 && (
                      <span className="text-xs text-[#003478] font-bold shrink-0">[{post.commentCount}]</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{post.authorNickname} · {post.categoryName}</div>
                </div>
                {post.likeCount > 0 && (
                  <span className="text-xs text-gray-400 shrink-0">❤ {post.likeCount}</span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 함께하는 교회 미리보기 */}
      {churches.length > 0 && (
        <section className="max-w-5xl mx-auto py-8 px-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">함께하는 교회</h2>
            <Link href="/churches" className="text-sm text-[#003478] hover:underline">전체 보기 →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {churches.map(c => (
              <Link key={c.id} href={`/churches/${c.id}`} className="p-4 bg-white rounded-xl border border-[#EDEFF1] hover:border-[#003478] hover:shadow-sm transition-all">
                <div className="font-semibold text-sm text-gray-800">{c.name}</div>
                <div className="text-xs text-gray-500 mt-1">{c.address}</div>
                {c.hasYouthGroup && (
                  <span className="mt-2 inline-block px-2 py-0.5 bg-blue-50 text-[#003478] text-xs rounded-full">청년부 있음</span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
