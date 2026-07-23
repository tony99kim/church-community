'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Church, Event } from '@/types';

export default function HomePage() {
  const [churches, setChurches] = useState<Church[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);

  useEffect(() => {
    api.get('/churches').then(r => setChurches(r.data.data?.slice(0, 4) ?? [])).catch(() => {});
    api.get('/events?size=3').then(r => setUpcomingEvents(r.data.data?.content ?? [])).catch(() => {});
  }, []);

  return (
    <main className="min-h-screen bg-[#f4f6f8]">
      {/* 히어로 */}
      <section className="bg-[#003478] text-white py-20 px-4 text-center">
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

      {/* 웰컴 테이블 강조 배너 */}
      <section className="bg-amber-50 border-b border-amber-200 py-6 px-4">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm text-amber-600 font-semibold mb-1">이번 달 웰컴 테이블</p>
            <h2 className="text-xl font-bold text-gray-800">혼자 먹는 밥이 익숙한 청년들의 식탁</h2>
            <p className="text-gray-600 text-sm mt-1">함께 요리하고, 먹고, 이야기해요 — 월 1회 소규모 공동식사</p>
          </div>
          <Link href="/events?category=WELCOME_TABLE" className="shrink-0 px-5 py-2.5 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors">
            참가 신청하기
          </Link>
        </div>
      </section>

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

      {/* 함께하는 교회 미리보기 */}
      {churches.length > 0 && (
        <section className="max-w-5xl mx-auto py-8 px-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">함께하는 교회</h2>
            <Link href="/churches" className="text-sm text-[#003478] hover:underline">전체 보기 →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {churches.map(c => (
              <div key={c.id} className="p-4 bg-white rounded-xl border border-[#EDEFF1]">
                <div className="font-semibold text-sm text-gray-800">{c.name}</div>
                <div className="text-xs text-gray-500 mt-1">{c.address}</div>
                {c.hasYouthGroup && (
                  <span className="mt-2 inline-block px-2 py-0.5 bg-blue-50 text-[#003478] text-xs rounded-full">청년부 있음</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
