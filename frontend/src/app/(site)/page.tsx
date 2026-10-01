'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Church, Event, Post } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function HomePage() {
  const [churches, setChurches] = useState<Church[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);
  const [welcomeEvent, setWelcomeEvent] = useState<Event | null>(null);
  const [loaded, setLoaded] = useState(false);
  const { user, isLoggedIn, hydrated } = useAuthStore();

  useEffect(() => {
    Promise.all([
      api.get('/churches').then(r => setChurches(r.data.data?.slice(0, 4) ?? [])).catch(() => {}),
      api.get('/events?size=3&sort=startDate,asc').then(r => setUpcomingEvents(r.data.data?.content ?? [])).catch(() => {}),
      api.get('/posts?size=5&sort=likeCount,desc').then(r => setPopularPosts(r.data.data?.content ?? [])).catch(() => {}),
      api.get('/events?category=WELCOME_TABLE&size=1&sort=startDate,asc').then(r => setWelcomeEvent(r.data.data?.content?.[0] ?? null)).catch(() => {}),
    ]).finally(() => setLoaded(true));
  }, []);

  return (
    <main className="min-h-screen bg-background">

      {/* 히어로 */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#003478] via-[#00409a] to-[#0055cc] text-white py-24 px-4">
        {/* 배경 패턴 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-8 left-1/4 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-blue-300 blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          {hydrated && isLoggedIn && user && (
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              안녕하세요, <span className="font-semibold">{user.nickname}</span>님 👋
            </div>
          )}
          <h1 className="serif text-4xl md:text-6xl font-extrabold mb-4 leading-tight">
            염리동 청년<br className="md:hidden" /> 커뮤니티
          </h1>
          <p className="text-lg md:text-xl text-blue-200 mb-10 max-w-xl mx-auto leading-relaxed">
            염리동 12개 교회 청년들이 함께 만들어가는<br className="hidden md:block" /> 따뜻한 동네 공동체
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/welcome"
              className="px-7 py-3 bg-white text-[#003478] font-bold rounded-full hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-sm">
              처음 오셨나요? →
            </Link>
            <Link href="/events"
              className="px-7 py-3 border-2 border-white/40 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-full hover:bg-white/20 transition-all text-sm">
              행사 안내 보기
            </Link>
          </div>
        </div>
      </section>

      {/* 웰컴 테이블 배너 */}
      {welcomeEvent && (
        <section className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
          <div className="max-w-4xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🍽</span>
              <div>
                <p className="text-xs text-amber-600 font-bold uppercase tracking-wide mb-0.5">WELCOME TABLE</p>
                <h2 className="text-base font-bold text-gray-800">{welcomeEvent.title}</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  📍 {welcomeEvent.location} · {new Date(welcomeEvent.startDate).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            <Link href={`/events/${welcomeEvent.id}`}
              className="shrink-0 px-5 py-2.5 bg-amber-500 text-white rounded-full font-semibold text-sm hover:bg-amber-600 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
              참가 신청하기
            </Link>
          </div>
        </section>
      )}

      {/* 빠른 메뉴 */}
      <section className="max-w-5xl mx-auto py-14 px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">무엇을 찾고 계신가요?</h2>
          <p className="text-sm text-muted-foreground mt-1">ChurchHub에서 필요한 것을 빠르게 찾아보세요</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: '/welcome', label: '처음 오셨나요?', emoji: '👋', desc: '웰컴 키트 · 동네 가이드', color: 'from-blue-50 to-indigo-50 border-blue-100 hover:border-blue-300' },
            { href: '/churches', label: '함께하는 교회', emoji: '⛪', desc: '염리동 12개 교회 소개', color: 'from-purple-50 to-violet-50 border-purple-100 hover:border-purple-300' },
            { href: '/spaces', label: '공간 대여', emoji: '🏠', desc: '교회 공간 무료 대여', color: 'from-green-50 to-emerald-50 border-green-100 hover:border-green-300' },
            { href: '/items', label: '물품 대여', emoji: '📦', desc: '이사·청소·행사 물품', color: 'from-orange-50 to-amber-50 border-orange-100 hover:border-orange-300' },
            { href: '/faith', label: '신앙 Q&A', emoji: '✝️', desc: '신앙 질문 · 기도 요청', color: 'from-sky-50 to-cyan-50 border-sky-100 hover:border-sky-300' },
            { href: '/community', label: '커뮤니티', emoji: '💬', desc: '자유게시판 · 소모임 모집', color: 'from-pink-50 to-rose-50 border-pink-100 hover:border-pink-300' },
            { href: '/events', label: '행사 안내', emoji: '📅', desc: '동네 · 신앙 · 섬김 모임', color: 'from-yellow-50 to-lime-50 border-yellow-100 hover:border-yellow-300' },
            { href: '/service', label: '지역 섬김', emoji: '🤝', desc: '봉사 · 복지관 연계', color: 'from-teal-50 to-green-50 border-teal-100 hover:border-teal-300' },
          ].map(item => (
            <Link key={item.href} href={item.href}>
              <Card className={`bg-gradient-to-br ${item.color} border transition-all duration-200 hover:shadow-md hover:-translate-y-1 cursor-pointer h-full`}>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl mb-2">{item.emoji}</div>
                  <div className="font-bold text-sm text-gray-800">{item.label}</div>
                  <div className="text-xs text-gray-500 mt-1 leading-relaxed">{item.desc}</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* 다가오는 행사 */}
      <section className="max-w-5xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">다가오는 행사 📅</h2>
            <p className="text-xs text-muted-foreground mt-0.5">놓치지 마세요</p>
          </div>
          <Link href="/events" className="text-sm text-primary font-semibold hover:underline underline-offset-2">
            전체 보기 →
          </Link>
        </div>
        {!loaded ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-40 bg-muted rounded-t-xl" />
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : upcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingEvents.map(e => (
              <Link key={e.id} href={`/events/${e.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer h-full">
                  <div className="w-full h-40 bg-gradient-to-br from-primary/10 to-primary/5 relative overflow-hidden">
                    {e.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={e.thumbnailUrl} alt={e.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">📅</div>
                    )}
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-white/90 text-primary border-0 shadow-sm text-xs font-semibold backdrop-blur-sm">
                        {new Date(e.startDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1">{e.title}</div>
                    <div className="text-xs text-muted-foreground">📍 {e.location}</div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      {/* 인기글 */}
      {popularPosts.length > 0 && (
        <section className="max-w-5xl mx-auto py-8 px-4">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">인기글 🔥</h2>
              <p className="text-xs text-muted-foreground mt-0.5">지금 뜨고 있는 이야기</p>
            </div>
            <Link href="/community" className="text-sm text-primary font-semibold hover:underline underline-offset-2">
              더 보기 →
            </Link>
          </div>
          <Card className="overflow-hidden divide-y divide-border">
            {popularPosts.map((post, idx) => (
              <Link key={post.id} href={`/posts/${post.id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-accent/50 transition-colors">
                <span className={`text-lg font-extrabold w-6 text-center shrink-0 ${idx === 0 ? 'text-primary' : idx < 3 ? 'text-gray-400' : 'text-gray-200'}`}>
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm font-medium text-gray-800 truncate">{post.title}</span>
                    {post.commentCount > 0 && (
                      <span className="text-xs text-primary font-bold shrink-0 bg-primary/5 px-1.5 py-0.5 rounded">[{post.commentCount}]</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{post.authorNickname} · {post.categoryName}</div>
                </div>
                {post.likeCount > 0 && (
                  <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                    <span className="text-red-400">❤</span> {post.likeCount}
                  </span>
                )}
              </Link>
            ))}
          </Card>
        </section>
      )}

      {/* 함께하는 교회 */}
      {churches.length > 0 && (
        <section className="max-w-5xl mx-auto py-8 px-4 pb-16">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">함께하는 교회 ⛪</h2>
              <p className="text-xs text-muted-foreground mt-0.5">염리동 12개 교회와 함께합니다</p>
            </div>
            <Link href="/churches" className="text-sm text-primary font-semibold hover:underline underline-offset-2">
              전체 보기 →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {churches.map(c => (
              <Link key={c.id} href={`/churches/${c.id}`}>
                <Card className="hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer h-full">
                  <CardContent className="p-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                      <span className="text-lg">⛪</span>
                    </div>
                    <div className="font-semibold text-sm text-gray-900 mb-1">{c.name}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{c.address}</div>
                    {c.hasYouthGroup && (
                      <Badge variant="secondary" className="mt-2 text-[10px] bg-primary/10 text-primary border-0">청년부 있음</Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
