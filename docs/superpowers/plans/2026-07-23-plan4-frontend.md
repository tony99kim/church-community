# Plan 4: Frontend — 전체 UI 재구조화

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 염리동 청년 커뮤니티 컨셉에 맞게 전체 네비게이션과 페이지를 재구성한다.

**Architecture:** Next.js 14 App Router. 기존 `(site)` 레이아웃 활용. 신규 페이지는 기존 패턴(API 호출 → Zustand authStore → Tailwind CSS, 메인 블루 `#003478`) 준수. **Plan 1~3 백엔드 완료 후 실행.**

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Zustand, Axios

## Global Constraints

- API prefix: `NEXT_PUBLIC_API_URL` + `/api/v1/`
- 메인 컬러: `#003478`
- 보더: `#EDEFF1`, 배경: `#f4f6f8`
- 기존 `frontend/src/lib/api.ts` (Axios 인스턴스) 사용
- 기존 `frontend/src/store/authStore.ts` (Zustand) 사용
- 기존 `frontend/src/types/index.ts` 타입 재사용 및 확장

---

## Task 1: 타입 확장 + 네비게이션 재구성

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/components/layout/Header.tsx` (또는 현재 헤더 파일 위치)

**Interfaces:**
- Produces: 새 메뉴 구조, 신규 타입 — 이후 모든 페이지가 사용

- [ ] **Step 1: 헤더 파일 위치 확인**

```bash
find frontend/src -name "Header*" -o -name "header*" | grep -v node_modules
```

- [ ] **Step 2: types/index.ts에 신규 타입 추가**

`frontend/src/types/index.ts` 파일 하단에 추가:
```typescript
// Church
export interface Church {
  id: number;
  name: string;
  address: string;
  sundayServiceTime: string | null;
  hasYouthGroup: boolean;
  contactInfo: string | null;
  introduction: string | null;
  websiteUrl: string | null;
  instagramUrl: string | null;
  visible: boolean;
  createdAt: string;
}

// Space Rental
export type RentalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface Space {
  id: number;
  churchName: string | null;
  name: string;
  description: string | null;
  usageTypes: string | null;
  capacity: number | null;
  available: boolean;
}

export interface SpaceRental {
  id: number;
  spaceId: number;
  spaceName: string;
  applicantNickname: string;
  startDateTime: string;
  endDateTime: string;
  headcount: number | null;
  purpose: string;
  contactPhone: string;
  status: RentalStatus;
  rejectReason: string | null;
  createdAt: string;
}

// Item Rental
export type ItemCategory = 'MOVING' | 'CLEANING' | 'LIVING' | 'EVENT';

export interface Item {
  id: number;
  name: string;
  description: string | null;
  category: ItemCategory;
  totalQuantity: number;
  availableQuantity: number;
}

export interface ItemRental {
  id: number;
  itemId: number;
  itemName: string;
  itemCategory: ItemCategory;
  applicantNickname: string;
  quantity: number;
  startDate: string;
  endDate: string;
  contactPhone: string;
  purpose: string | null;
  status: RentalStatus;
  rejectReason: string | null;
  createdAt: string;
}

// Faith
export interface FaithAnswer {
  id: number;
  pastorNickname: string;
  content: string;
  createdAt: string;
}

export interface FaithQuestion {
  id: number;
  authorNickname: string | null;
  anonymous: boolean;
  content: string;
  publicVisible: boolean;
  answers: FaithAnswer[];
  createdAt: string;
}

export interface PrayerRequest {
  id: number;
  authorNickname: string;
  content: string;
  publicVisible: boolean;
  prayerCount: number;
  createdAt: string;
}

// Event category
export type EventCategory = 'NEIGHBORHOOD' | 'FAITH' | 'SERVICE' | 'CHURCH' | 'WELCOME_TABLE';

// WelcomeKit
export interface WelcomeKit {
  id: number;
  name: string;
  phone: string;
  address: string | null;
  message: string | null;
  processed: boolean;
  createdAt: string;
}
```

- [ ] **Step 3: Header 네비게이션 재구성**

기존 Header 파일을 열어 nav 링크 부분을 아래로 교체:
```tsx
{/* 데스크탑 네비게이션 */}
<nav className="hidden md:flex items-center gap-6 text-sm font-medium">
  <Link href="/welcome" className="hover:text-[#003478] transition-colors">처음 오셨나요?</Link>
  <Link href="/churches" className="hover:text-[#003478] transition-colors">함께하는 교회</Link>
  <Link href="/events" className="hover:text-[#003478] transition-colors">행사 안내</Link>
  <Link href="/community" className="hover:text-[#003478] transition-colors">커뮤니티</Link>
  <Link href="/spaces" className="hover:text-[#003478] transition-colors">공간 대여</Link>
  <Link href="/items" className="hover:text-[#003478] transition-colors">물품 대여</Link>
  <Link href="/faith" className="hover:text-[#003478] transition-colors">신앙 Q&A</Link>
  <Link href="/service" className="hover:text-[#003478] transition-colors">지역 섬김</Link>
  {/* Discord 링크 */}
  <a
    href="https://discord.gg/YOUR_INVITE_CODE"
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-1 px-3 py-1.5 bg-[#5865F2] text-white rounded-md text-xs hover:bg-[#4752C4] transition-colors"
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.032.056a19.9 19.9 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.075.075 0 0 0-.041-.104 13.2 13.2 0 0 1-1.872-.892.077.077 0 0 1-.008-.127 10.2 10.2 0 0 0 .372-.292.073.073 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.073.073 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
    </svg>
    Discord
  </a>
</nav>
```

> **주의:** Discord 초대 링크 `YOUR_INVITE_CODE` 부분은 실제 서버 초대 코드로 교체

- [ ] **Step 4: Commit**

```bash
git add frontend/src/types/index.ts frontend/src/components/
git commit -m "feat: 타입 확장 + 네비게이션 재구성 + Discord 링크 추가"
```

---

## Task 2: 홈 랜딩 페이지 (`/`)

**Files:**
- Modify: `frontend/src/app/(site)/page.tsx`

**Interfaces:**
- Consumes: Church, Event API (GET /api/v1/churches, GET /api/v1/events)

- [ ] **Step 1: 홈 페이지 재작성**

`frontend/src/app/(site)/page.tsx`:
```tsx
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
            <p className="text-sm text-amber-600 font-semibold mb-1">🍽 이번 달 웰컴 테이블</p>
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
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/app/\(site\)/page.tsx
git commit -m "feat: 홈 랜딩 페이지 재구성 (염리동 청년 커뮤니티)"
```

---

## Task 3: 염리동 웰컴 페이지 (`/welcome`)

**Files:**
- Create: `frontend/src/app/(site)/welcome/page.tsx`

- [ ] **Step 1: 웰컴 페이지 생성**

`frontend/src/app/(site)/welcome/page.tsx`:
```tsx
'use client';

import { useState } from 'react';
import api from '@/lib/api';

export default function WelcomePage() {
  const [form, setForm] = useState({ name: '', phone: '', address: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/welcome/kit', form);
      setSubmitted(true);
    } catch {
      alert('신청 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f6f8] py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-[#003478] mb-2">처음 오셨나요? 👋</h1>
        <p className="text-gray-600 mb-8">염리동에 새로 오신 청년을 환영해요. 필요한 것들을 모아뒀어요.</p>

        {/* 탭: 웰컴키트 / 동네가이드 / 청년지원 / 교회연결 */}
        <div className="space-y-8">

          {/* 웰컴 키트 신청 */}
          <section className="bg-white rounded-2xl border border-[#EDEFF1] p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">🎁 웰컴 키트 신청</h2>
            <p className="text-sm text-gray-500 mb-4">새로 이사 온 청년, 1인 가구 청년에게 환영 키트를 드립니다.</p>
            {submitted ? (
              <div className="text-center py-6 text-green-600 font-medium">
                신청이 완료되었습니다! 담당자가 연락드릴게요 😊
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <input required placeholder="이름" value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-[#EDEFF1] rounded-lg text-sm focus:outline-none focus:border-[#003478]" />
                <input required placeholder="연락처" value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-[#EDEFF1] rounded-lg text-sm focus:outline-none focus:border-[#003478]" />
                <input placeholder="주소 (선택)" value={form.address}
                  onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-[#EDEFF1] rounded-lg text-sm focus:outline-none focus:border-[#003478]" />
                <textarea placeholder="하고 싶은 말 (선택)" value={form.message}
                  onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-[#EDEFF1] rounded-lg text-sm focus:outline-none focus:border-[#003478] resize-none" />
                <button type="submit" disabled={loading}
                  className="w-full py-2.5 bg-[#003478] text-white rounded-lg font-medium hover:bg-blue-900 transition-colors disabled:opacity-50">
                  {loading ? '신청 중...' : '웰컴 키트 신청하기'}
                </button>
              </form>
            )}
          </section>

          {/* 동네 생활 가이드 */}
          <section className="bg-white rounded-2xl border border-[#EDEFF1] p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">🗺 동네 생활 가이드</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: '마트', items: ['이마트 공덕점', 'GS25 염리점'] },
                { label: '병원', items: ['마포구 보건소', '연세365의원'] },
                { label: '카페', items: ['스타벅스 공덕역점', '동네 카페들'] },
                { label: '도서관', items: ['마포구립서강도서관', '공덕아리수도서관'] },
                { label: '운동', items: ['마포한강공원', '염리어린이공원'] },
                { label: '산책', items: ['와우산 둘레길', '한강 보행로'] },
              ].map(cat => (
                <div key={cat.label} className="p-3 bg-[#f4f6f8] rounded-lg">
                  <div className="font-semibold text-sm text-[#003478] mb-1">{cat.label}</div>
                  {cat.items.map(i => <div key={i} className="text-xs text-gray-600">{i}</div>)}
                </div>
              ))}
            </div>
          </section>

          {/* 청년 도움 링크 */}
          <section className="bg-white rounded-2xl border border-[#EDEFF1] p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">🔗 청년 도움 링크</h2>
            <div className="space-y-2">
              {[
                { label: '청년 월세 지원 (서울시)', href: 'https://youth.seoul.go.kr' },
                { label: '마포구 청년 정책', href: 'https://www.mapo.go.kr' },
                { label: '마포구 복지관', href: 'https://www.mapo.go.kr' },
                { label: '마음건강 위기상담 (정신건강 위기상담 전화 1577-0199)', href: 'tel:15770199' },
              ].map(link => (
                <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 border border-[#EDEFF1] rounded-lg hover:border-[#003478] transition-colors">
                  <span className="text-sm text-gray-700">{link.label}</span>
                  <span className="text-xs text-[#003478]">→</span>
                </a>
              ))}
            </div>
          </section>

          {/* 교회 연결 문의 */}
          <section className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-2">⛪ 교회를 찾고 계신가요?</h2>
            <p className="text-sm text-gray-600 mb-4">부담 없이 문의해 주세요. 가까운 교회와 청년 모임을 안내해 드릴게요.</p>
            <a href="https://discord.gg/YOUR_INVITE_CODE" target="_blank" rel="noopener noreferrer"
              className="inline-block px-5 py-2.5 bg-[#003478] text-white rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors">
              Discord로 문의하기
            </a>
          </section>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/app/\(site\)/welcome/
git commit -m "feat: 염리동 웰컴 페이지 추가 (/welcome)"
```

---

## Task 4: 교회 소개 페이지 (`/churches`)

**Files:**
- Create: `frontend/src/app/(site)/churches/page.tsx`

- [ ] **Step 1: 교회 소개 페이지 생성**

`frontend/src/app/(site)/churches/page.tsx`:
```tsx
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Church } from '@/types';

export default function ChurchesPage() {
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/churches')
      .then(r => setChurches(r.data.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">불러오는 중...</div>;

  return (
    <main className="min-h-screen bg-[#f4f6f8] py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[#003478] mb-2">함께하는 교회 ⛪</h1>
        <p className="text-gray-600 mb-8">염리동 교동협의회 소속 교회들을 소개합니다.</p>

        {churches.length === 0 ? (
          <div className="text-center py-20 text-gray-400">등록된 교회가 없습니다.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {churches.map(church => (
              <div key={church.id} className="bg-white rounded-2xl border border-[#EDEFF1] p-5 hover:border-[#003478] transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-lg font-bold text-gray-800">{church.name}</h2>
                  {church.hasYouthGroup && (
                    <span className="px-2 py-0.5 bg-blue-50 text-[#003478] text-xs rounded-full shrink-0 ml-2">청년부</span>
                  )}
                </div>
                {church.introduction && (
                  <p className="text-sm text-gray-600 mb-3">{church.introduction}</p>
                )}
                <div className="space-y-1.5 text-xs text-gray-500">
                  <div>📍 {church.address}</div>
                  {church.sundayServiceTime && <div>🕐 주일예배 {church.sundayServiceTime}</div>}
                  {church.contactInfo && <div>📞 {church.contactInfo}</div>}
                </div>
                {(church.websiteUrl || church.instagramUrl) && (
                  <div className="flex gap-2 mt-3">
                    {church.websiteUrl && (
                      <a href={church.websiteUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs px-3 py-1 border border-[#EDEFF1] rounded-full hover:border-[#003478] transition-colors">
                        홈페이지
                      </a>
                    )}
                    {church.instagramUrl && (
                      <a href={church.instagramUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs px-3 py-1 border border-[#EDEFF1] rounded-full hover:border-[#003478] transition-colors">
                        인스타그램
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/app/\(site\)/churches/
git commit -m "feat: 교회 소개 페이지 추가 (/churches)"
```

---

## Task 5: 공간 대여 페이지 (`/spaces`)

**Files:**
- Create: `frontend/src/app/(site)/spaces/page.tsx`
- Create: `frontend/src/app/(site)/spaces/[id]/page.tsx`

- [ ] **Step 1: 공간 목록 페이지 생성**

`frontend/src/app/(site)/spaces/page.tsx`:
```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Space } from '@/types';
import { useAuthStore } from '@/store/authStore';

export default function SpacesPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const { isLoggedIn } = useAuthStore();

  useEffect(() => {
    api.get('/spaces').then(r => setSpaces(r.data.data ?? [])).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">불러오는 중...</div>;

  return (
    <main className="min-h-screen bg-[#f4f6f8] py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[#003478] mb-2">공간 대여 🏠</h1>
        <p className="text-gray-600 mb-2">교회 공간을 무료로 빌릴 수 있어요. 담당자 확인 후 최종 승인됩니다.</p>
        {!isLoggedIn && (
          <p className="text-sm text-amber-600 mb-6">※ 신청하려면 <Link href="/login" className="underline">로그인</Link>이 필요합니다.</p>
        )}

        {spaces.length === 0 ? (
          <div className="text-center py-20 text-gray-400">등록된 공간이 없습니다.</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {spaces.map(space => (
              <div key={space.id} className="bg-white rounded-2xl border border-[#EDEFF1] p-5">
                <div className="flex items-start justify-between mb-2">
                  <h2 className="text-lg font-bold text-gray-800">{space.name}</h2>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${space.available ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                    {space.available ? '대여 가능' : '대여 불가'}
                  </span>
                </div>
                {space.churchName && <div className="text-xs text-gray-400 mb-2">⛪ {space.churchName}</div>}
                {space.description && <p className="text-sm text-gray-600 mb-3">{space.description}</p>}
                <div className="text-xs text-gray-500 space-y-1">
                  {space.usageTypes && <div>✅ 사용 용도: {space.usageTypes}</div>}
                  {space.capacity && <div>👥 수용 인원: {space.capacity}명</div>}
                </div>
                {isLoggedIn && space.available && (
                  <Link href={`/spaces/${space.id}`}
                    className="mt-4 block text-center py-2 bg-[#003478] text-white rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors">
                    신청하기
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: 공간 신청 페이지 생성**

`frontend/src/app/(site)/spaces/[id]/page.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';

export default function SpaceApplyPage() {
  const { id } = useParams();
  const router = useRouter();
  const [form, setForm] = useState({
    startDateTime: '', endDateTime: '', headcount: '', purpose: '', contactPhone: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/spaces/${id}/rentals`, {
        ...form,
        headcount: form.headcount ? Number(form.headcount) : null
      });
      alert('신청이 완료되었습니다. 담당자 확인 후 연락드릴게요.');
      router.push('/spaces');
    } catch {
      alert('신청 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f6f8] py-10 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-[#003478] mb-6">공간 대여 신청</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm text-amber-700">
          자동 예약이 아닙니다. 담당자가 확인 후 연락드립니다.
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#EDEFF1] p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">시작 일시</label>
            <input required type="datetime-local" value={form.startDateTime}
              onChange={e => setForm(p => ({ ...p, startDateTime: e.target.value }))}
              className="w-full px-4 py-2.5 border border-[#EDEFF1] rounded-lg text-sm focus:outline-none focus:border-[#003478]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">종료 일시</label>
            <input required type="datetime-local" value={form.endDateTime}
              onChange={e => setForm(p => ({ ...p, endDateTime: e.target.value }))}
              className="w-full px-4 py-2.5 border border-[#EDEFF1] rounded-lg text-sm focus:outline-none focus:border-[#003478]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">예상 인원</label>
            <input type="number" min="1" value={form.headcount}
              onChange={e => setForm(p => ({ ...p, headcount: e.target.value }))}
              className="w-full px-4 py-2.5 border border-[#EDEFF1] rounded-lg text-sm focus:outline-none focus:border-[#003478]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">사용 목적 *</label>
            <textarea required value={form.purpose} rows={3}
              onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))}
              className="w-full px-4 py-2.5 border border-[#EDEFF1] rounded-lg text-sm focus:outline-none focus:border-[#003478] resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">연락처 *</label>
            <input required value={form.contactPhone}
              onChange={e => setForm(p => ({ ...p, contactPhone: e.target.value }))}
              className="w-full px-4 py-2.5 border border-[#EDEFF1] rounded-lg text-sm focus:outline-none focus:border-[#003478]" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-[#003478] text-white rounded-lg font-medium hover:bg-blue-900 transition-colors disabled:opacity-50">
            {loading ? '신청 중...' : '신청하기'}
          </button>
        </form>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/\(site\)/spaces/
git commit -m "feat: 공간 대여 목록 + 신청 페이지 추가 (/spaces)"
```

---

## Task 6: 물품 대여 페이지 (`/items`)

**Files:**
- Create: `frontend/src/app/(site)/items/page.tsx`
- Create: `frontend/src/app/(site)/items/[id]/page.tsx`

- [ ] **Step 1: 물품 목록 페이지 생성**

`frontend/src/app/(site)/items/page.tsx`:
```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Item, ItemCategory } from '@/types';
import { useAuthStore } from '@/store/authStore';

const CATEGORY_LABELS: Record<ItemCategory, string> = {
  MOVING: '🚛 이사/정리',
  CLEANING: '🧹 청소',
  LIVING: '🛋 생활',
  EVENT: '🎪 행사',
};

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<ItemCategory | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const { isLoggedIn } = useAuthStore();

  useEffect(() => {
    api.get('/items').then(r => setItems(r.data.data ?? [])).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'ALL' ? items : items.filter(i => i.category === filter);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">불러오는 중...</div>;

  return (
    <main className="min-h-screen bg-[#f4f6f8] py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[#003478] mb-2">물품 대여 📦</h1>
        <p className="text-gray-600 mb-6">이사, 청소, 생활, 행사에 필요한 물품을 빌려드립니다.</p>

        {/* 카테고리 필터 */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['ALL', 'MOVING', 'CLEANING', 'LIVING', 'EVENT'] as const).map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === cat ? 'bg-[#003478] text-white' : 'bg-white border border-[#EDEFF1] text-gray-600 hover:border-[#003478]'}`}>
              {cat === 'ALL' ? '전체' : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">등록된 물품이 없습니다.</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {filtered.map(item => (
              <div key={item.id} className="bg-white rounded-2xl border border-[#EDEFF1] p-5">
                <div className="text-xs text-gray-400 mb-1">{CATEGORY_LABELS[item.category]}</div>
                <h2 className="text-base font-bold text-gray-800 mb-2">{item.name}</h2>
                {item.description && <p className="text-xs text-gray-500 mb-3">{item.description}</p>}
                <div className="text-xs text-gray-500 mb-4">
                  재고: {item.availableQuantity} / {item.totalQuantity}개
                </div>
                {isLoggedIn && item.availableQuantity > 0 ? (
                  <Link href={`/items/${item.id}`}
                    className="block text-center py-2 bg-[#003478] text-white rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors">
                    대여 신청
                  </Link>
                ) : item.availableQuantity === 0 ? (
                  <div className="text-center py-2 bg-gray-100 text-gray-400 rounded-lg text-sm">재고 없음</div>
                ) : (
                  <Link href="/login" className="block text-center py-2 border border-[#003478] text-[#003478] rounded-lg text-sm hover:bg-blue-50 transition-colors">
                    로그인 후 신청
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: 물품 신청 페이지 생성**

`frontend/src/app/(site)/items/[id]/page.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';

const TERMS = `
1. 대여 기간: 신청 시 지정한 기간 내 반납
2. 파손 시: 수리 또는 동등 물품으로 배상
3. 반납 장소: 대여한 교회로 반납
4. 신분 확인: 대여 시 신분증 확인
5. 담당자 승인 후 대여 가능
`;

export default function ItemApplyPage() {
  const { id } = useParams();
  const router = useRouter();
  const [form, setForm] = useState({
    quantity: 1, startDate: '', endDate: '', contactPhone: '', purpose: ''
  });
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAgreed) { alert('약관에 동의해주세요.'); return; }
    setLoading(true);
    try {
      await api.post(`/items/${id}/rentals`, { ...form, termsAgreed });
      alert('신청이 완료되었습니다. 담당자 확인 후 연락드릴게요.');
      router.push('/items');
    } catch (err: any) {
      alert(err?.response?.data?.message ?? '신청 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f6f8] py-10 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-[#003478] mb-6">물품 대여 신청</h1>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#EDEFF1] p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">수량</label>
            <input required type="number" min="1" value={form.quantity}
              onChange={e => setForm(p => ({ ...p, quantity: Number(e.target.value) }))}
              className="w-full px-4 py-2.5 border border-[#EDEFF1] rounded-lg text-sm focus:outline-none focus:border-[#003478]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">대여 시작일</label>
              <input required type="date" value={form.startDate}
                onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                className="w-full px-4 py-2.5 border border-[#EDEFF1] rounded-lg text-sm focus:outline-none focus:border-[#003478]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">반납 예정일</label>
              <input required type="date" value={form.endDate}
                onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                className="w-full px-4 py-2.5 border border-[#EDEFF1] rounded-lg text-sm focus:outline-none focus:border-[#003478]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">연락처 *</label>
            <input required value={form.contactPhone}
              onChange={e => setForm(p => ({ ...p, contactPhone: e.target.value }))}
              className="w-full px-4 py-2.5 border border-[#EDEFF1] rounded-lg text-sm focus:outline-none focus:border-[#003478]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">사용 목적</label>
            <textarea value={form.purpose} rows={2}
              onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))}
              className="w-full px-4 py-2.5 border border-[#EDEFF1] rounded-lg text-sm focus:outline-none focus:border-[#003478] resize-none" />
          </div>
          {/* 약관 */}
          <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600 whitespace-pre-line border border-[#EDEFF1]">
            {TERMS}
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={termsAgreed} onChange={e => setTermsAgreed(e.target.checked)}
              className="w-4 h-4 accent-[#003478]" />
            <span className="text-sm text-gray-700">위 약관에 동의합니다</span>
          </label>
          <button type="submit" disabled={loading || !termsAgreed}
            className="w-full py-3 bg-[#003478] text-white rounded-lg font-medium hover:bg-blue-900 transition-colors disabled:opacity-50">
            {loading ? '신청 중...' : '신청하기'}
          </button>
        </form>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/\(site\)/items/
git commit -m "feat: 물품 대여 목록 + 신청 페이지 추가 (/items)"
```

---

## Task 7: 신앙 Q&A 페이지 (`/faith`)

**Files:**
- Create: `frontend/src/app/(site)/faith/page.tsx`

- [ ] **Step 1: 신앙 Q&A 페이지 생성**

`frontend/src/app/(site)/faith/page.tsx`:
```tsx
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { FaithQuestion, PrayerRequest } from '@/types';
import { useAuthStore } from '@/store/authStore';

type Tab = 'questions' | 'prayers';

export default function FaithPage() {
  const [tab, setTab] = useState<Tab>('questions');
  const [questions, setQuestions] = useState<FaithQuestion[]>([]);
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [qForm, setQForm] = useState({ content: '', anonymous: false, publicVisible: true });
  const [pForm, setPForm] = useState({ content: '', publicVisible: true });
  const [loading, setLoading] = useState(true);
  const { isLoggedIn } = useAuthStore();

  useEffect(() => {
    Promise.all([
      api.get('/faith/questions').then(r => setQuestions(r.data.data ?? [])),
      api.get('/faith/prayers').then(r => setPrayers(r.data.data ?? [])),
    ]).finally(() => setLoading(false));
  }, []);

  const submitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/faith/questions', qForm);
    setQForm({ content: '', anonymous: false, publicVisible: true });
    api.get('/faith/questions').then(r => setQuestions(r.data.data ?? []));
  };

  const submitPrayer = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/faith/prayers', pForm);
    setPForm({ content: '', publicVisible: true });
    api.get('/faith/prayers').then(r => setPrayers(r.data.data ?? []));
  };

  const pray = async (id: number) => {
    await api.post(`/faith/prayers/${id}/pray`);
    setPrayers(prev => prev.map(p => p.id === id ? { ...p, prayerCount: p.prayerCount + 1 } : p));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">불러오는 중...</div>;

  return (
    <main className="min-h-screen bg-[#f4f6f8] py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-[#003478] mb-2">신앙 Q&A ✝️</h1>
        <p className="text-gray-600 mb-6">신앙 질문을 남기면 목사님이 답변해 드립니다.</p>

        {/* 탭 */}
        <div className="flex gap-2 mb-6">
          {([['questions', '신앙 질문'], ['prayers', '기도 요청']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${tab === key ? 'bg-[#003478] text-white' : 'bg-white border border-[#EDEFF1] text-gray-600'}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'questions' && (
          <div className="space-y-4">
            {/* 질문 작성 */}
            {isLoggedIn && (
              <form onSubmit={submitQuestion} className="bg-white rounded-2xl border border-[#EDEFF1] p-5">
                <textarea required value={qForm.content} rows={3} placeholder="신앙에 대해 궁금한 점을 남겨주세요..."
                  onChange={e => setQForm(p => ({ ...p, content: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-[#EDEFF1] rounded-lg text-sm focus:outline-none focus:border-[#003478] resize-none mb-3" />
                <div className="flex items-center justify-between">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                      <input type="checkbox" checked={qForm.anonymous}
                        onChange={e => setQForm(p => ({ ...p, anonymous: e.target.checked }))}
                        className="accent-[#003478]" />
                      익명
                    </label>
                    <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                      <input type="checkbox" checked={qForm.publicVisible}
                        onChange={e => setQForm(p => ({ ...p, publicVisible: e.target.checked }))}
                        className="accent-[#003478]" />
                      공개
                    </label>
                  </div>
                  <button type="submit" className="px-4 py-2 bg-[#003478] text-white rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors">
                    질문하기
                  </button>
                </div>
              </form>
            )}

            {/* 질문 목록 */}
            {questions.map(q => (
              <div key={q.id} className="bg-white rounded-2xl border border-[#EDEFF1] p-5">
                <div className="flex items-center gap-2 mb-2 text-xs text-gray-400">
                  <span>{q.anonymous ? '익명' : q.authorNickname}</span>
                  <span>·</span>
                  <span>{new Date(q.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-gray-800 text-sm mb-3">{q.content}</p>
                {q.answers.length > 0 && (
                  <div className="border-t border-[#EDEFF1] pt-3 space-y-2">
                    {q.answers.map(a => (
                      <div key={a.id} className="bg-blue-50 rounded-lg p-3">
                        <div className="text-xs text-[#003478] font-medium mb-1">목사님 답변 — {a.pastorNickname}</div>
                        <p className="text-sm text-gray-700">{a.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'prayers' && (
          <div className="space-y-4">
            {/* 기도 요청 작성 */}
            {isLoggedIn && (
              <form onSubmit={submitPrayer} className="bg-white rounded-2xl border border-[#EDEFF1] p-5">
                <textarea required value={pForm.content} rows={3} placeholder="기도 제목을 나눠주세요..."
                  onChange={e => setPForm(p => ({ ...p, content: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-[#EDEFF1] rounded-lg text-sm focus:outline-none focus:border-[#003478] resize-none mb-3" />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={pForm.publicVisible}
                      onChange={e => setPForm(p => ({ ...p, publicVisible: e.target.checked }))}
                      className="accent-[#003478]" />
                    공개
                  </label>
                  <button type="submit" className="px-4 py-2 bg-[#003478] text-white rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors">
                    등록하기
                  </button>
                </div>
              </form>
            )}

            {/* 기도 목록 */}
            {prayers.map(p => (
              <div key={p.id} className="bg-white rounded-2xl border border-[#EDEFF1] p-5">
                <div className="text-xs text-gray-400 mb-2">{p.authorNickname} · {new Date(p.createdAt).toLocaleDateString()}</div>
                <p className="text-gray-800 text-sm mb-3">{p.content}</p>
                <button onClick={() => pray(p.id)}
                  className="text-xs px-3 py-1.5 border border-[#EDEFF1] rounded-full text-gray-600 hover:border-[#003478] hover:text-[#003478] transition-colors">
                  🙏 함께 기도할게요 {p.prayerCount > 0 && `(${p.prayerCount})`}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/app/\(site\)/faith/
git commit -m "feat: 신앙 Q&A + 기도 요청 페이지 추가 (/faith)"
```

---

## Task 8: 행사 + 지역섬김 + 커뮤니티 페이지

**Files:**
- Modify: `frontend/src/app/(site)/events/page.tsx` (카테고리 필터 추가)
- Create: `frontend/src/app/(site)/service/page.tsx`
- Create: `frontend/src/app/(site)/community/page.tsx`

- [ ] **Step 1: 행사 페이지에 카테고리 필터 추가**

`frontend/src/app/(site)/events/page.tsx` 상단에 카테고리 필터 UI 추가:
```tsx
const EVENT_CATEGORIES = [
  { value: '', label: '전체' },
  { value: 'NEIGHBORHOOD', label: '🏘 동네 모임' },
  { value: 'FAITH', label: '✝️ 신앙 모임' },
  { value: 'SERVICE', label: '🤝 섬김 모임' },
  { value: 'CHURCH', label: '⛪ 교회별 행사' },
  { value: 'WELCOME_TABLE', label: '🍽 웰컴 테이블' },
];

// state 추가
const [category, setCategory] = useState('');

// API 호출 시 쿼리 파라미터 추가
api.get(`/events?${category ? `category=${category}&` : ''}size=12`)
```

필터 버튼 UI (기존 목록 위에 추가):
```tsx
<div className="flex flex-wrap gap-2 mb-6">
  {EVENT_CATEGORIES.map(cat => (
    <button key={cat.value} onClick={() => setCategory(cat.value)}
      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${category === cat.value ? 'bg-[#003478] text-white' : 'bg-white border border-[#EDEFF1] text-gray-600 hover:border-[#003478]'}`}>
      {cat.label}
    </button>
  ))}
</div>
```

- [ ] **Step 2: 지역섬김 페이지 생성 (행사 SERVICE 카테고리 필터 래핑)**

`frontend/src/app/(site)/service/page.tsx`:
```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Event } from '@/types';

export default function ServicePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/events?category=SERVICE&size=20')
      .then(r => setEvents(r.data.data?.content ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">불러오는 중...</div>;

  return (
    <main className="min-h-screen bg-[#f4f6f8] py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[#003478] mb-2">지역 섬김 🤝</h1>
        <p className="text-gray-600 mb-8">염리동에서 함께 섬기는 봉사 기회들을 모아뒀어요.</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
          {['복지관 연계 봉사', '청년주택 환대', '독거 어르신 도시락',
            '환경 정화', '여름성경학교 지원', '지역 축제 스태프'].map(label => (
            <div key={label} className="p-3 bg-white border border-[#EDEFF1] rounded-xl text-sm text-gray-600 text-center">
              {label}
            </div>
          ))}
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="mb-4">현재 모집 중인 봉사가 없어요.</p>
            <Link href="/community?category=GATHERING" className="text-[#003478] underline text-sm">
              소모임 모집 게시판 보기 →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map(event => (
              <Link key={event.id} href={`/events/${event.id}`}
                className="block bg-white rounded-xl border border-[#EDEFF1] p-4 hover:border-[#003478] transition-colors">
                <div className="font-semibold text-gray-800">{event.title}</div>
                <div className="text-xs text-gray-400 mt-1">{new Date(event.startDate).toLocaleDateString()}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 3: 커뮤니티 게시판 허브 페이지 생성**

`frontend/src/app/(site)/community/page.tsx`:
```tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { Post, Category } from '@/types';
import { useAuthStore } from '@/store/authStore';

export default function CommunityPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/categories').then(r => {
      const cats: Category[] = (r.data.data ?? []).filter((c: Category) =>
        ['NOTICE', 'FREE', 'GATHERING'].includes(c.type)
      );
      setCategories(cats);
      if (cats.length > 0) setActiveCategory(cats[0].id);
    });
  }, []);

  useEffect(() => {
    if (!activeCategory) return;
    setLoading(true);
    api.get(`/posts?categoryId=${activeCategory}&size=20`)
      .then(r => setPosts(r.data.data?.content ?? []))
      .finally(() => setLoading(false));
  }, [activeCategory]);

  return (
    <main className="min-h-screen bg-[#f4f6f8] py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-[#003478] mb-6">커뮤니티 💬</h1>

        {/* 카테고리 탭 */}
        <div className="flex gap-2 mb-6">
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === cat.id ? 'bg-[#003478] text-white' : 'bg-white border border-[#EDEFF1] text-gray-600'}`}>
              {cat.name}
            </button>
          ))}
        </div>

        {/* 글쓰기 버튼 */}
        {isLoggedIn && activeCategory && (
          <div className="flex justify-end mb-4">
            <Link href={`/posts/write?categoryId=${activeCategory}`}
              className="px-4 py-2 bg-[#003478] text-white rounded-lg text-sm font-medium hover:bg-blue-900 transition-colors">
              글쓰기
            </Link>
          </div>
        )}

        {/* 게시글 목록 */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">불러오는 중...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">게시글이 없습니다.</div>
        ) : (
          <div className="space-y-2">
            {posts.map(post => (
              <Link key={post.id} href={`/posts/${post.id}`}
                className="flex items-center justify-between bg-white rounded-xl border border-[#EDEFF1] px-4 py-3 hover:border-[#003478] transition-colors">
                <div>
                  <div className="text-sm font-medium text-gray-800">{post.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{post.authorNickname} · {new Date(post.createdAt).toLocaleDateString()}</div>
                </div>
                {post.commentCount > 0 && (
                  <span className="text-xs text-gray-400">[{post.commentCount}]</span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/\(site\)/events/page.tsx \
        frontend/src/app/\(site\)/service/ \
        frontend/src/app/\(site\)/community/
git commit -m "feat: 행사 카테고리 필터 + 지역섬김 + 커뮤니티 게시판 페이지 추가"
```

---

## Task 9: Admin 대시보드 확장

**Files:**
- Modify: `frontend/src/app/admin/layout.tsx` (사이드바 메뉴 추가)
- Create: `frontend/src/app/admin/churches/page.tsx`
- Create: `frontend/src/app/admin/spaces/page.tsx`
- Create: `frontend/src/app/admin/items/page.tsx`
- Create: `frontend/src/app/admin/welcome-kits/page.tsx`

- [ ] **Step 1: Admin 사이드바에 신규 메뉴 추가**

`frontend/src/app/admin/layout.tsx`의 사이드바 링크 목록에 추가:
```tsx
<Link href="/admin/churches" className="...">교회 관리</Link>
<Link href="/admin/spaces" className="...">공간 대여 관리</Link>
<Link href="/admin/items" className="...">물품 대여 관리</Link>
<Link href="/admin/welcome-kits" className="...">웰컴 키트 신청</Link>
```

- [ ] **Step 2: 교회 관리 페이지 생성**

`frontend/src/app/admin/churches/page.tsx`:
```tsx
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Church } from '@/types';

export default function AdminChurchesPage() {
  const [churches, setChurches] = useState<Church[]>([]);
  const [form, setForm] = useState({
    name: '', address: '', sundayServiceTime: '', hasYouthGroup: false,
    contactInfo: '', introduction: '', websiteUrl: '', instagramUrl: ''
  });
  const [loading, setLoading] = useState(true);

  const fetchChurches = () => {
    api.get('/churches').then(r => setChurches(r.data.data ?? [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchChurches(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/admin/churches', form);
    setForm({ name: '', address: '', sundayServiceTime: '', hasYouthGroup: false, contactInfo: '', introduction: '', websiteUrl: '', instagramUrl: '' });
    fetchChurches();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('삭제하시겠습니까?')) return;
    await api.delete(`/admin/churches/${id}`);
    fetchChurches();
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-6">교회 관리</h1>
      <form onSubmit={handleCreate} className="bg-white border border-[#EDEFF1] rounded-xl p-4 mb-6 grid grid-cols-2 gap-3">
        <input required placeholder="교회명 *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="col-span-2 px-3 py-2 border border-[#EDEFF1] rounded-lg text-sm" />
        <input required placeholder="주소 *" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className="col-span-2 px-3 py-2 border border-[#EDEFF1] rounded-lg text-sm" />
        <input placeholder="주일예배 시간" value={form.sundayServiceTime} onChange={e => setForm(p => ({ ...p, sundayServiceTime: e.target.value }))} className="px-3 py-2 border border-[#EDEFF1] rounded-lg text-sm" />
        <input placeholder="연락처" value={form.contactInfo} onChange={e => setForm(p => ({ ...p, contactInfo: e.target.value }))} className="px-3 py-2 border border-[#EDEFF1] rounded-lg text-sm" />
        <input placeholder="한 줄 소개" value={form.introduction} onChange={e => setForm(p => ({ ...p, introduction: e.target.value }))} className="col-span-2 px-3 py-2 border border-[#EDEFF1] rounded-lg text-sm" />
        <input placeholder="홈페이지 URL" value={form.websiteUrl} onChange={e => setForm(p => ({ ...p, websiteUrl: e.target.value }))} className="px-3 py-2 border border-[#EDEFF1] rounded-lg text-sm" />
        <input placeholder="인스타그램 URL" value={form.instagramUrl} onChange={e => setForm(p => ({ ...p, instagramUrl: e.target.value }))} className="px-3 py-2 border border-[#EDEFF1] rounded-lg text-sm" />
        <label className="flex items-center gap-2 text-sm col-span-2">
          <input type="checkbox" checked={form.hasYouthGroup} onChange={e => setForm(p => ({ ...p, hasYouthGroup: e.target.checked }))} className="accent-[#003478]" />
          청년부 있음
        </label>
        <button type="submit" className="col-span-2 py-2 bg-[#003478] text-white rounded-lg text-sm font-medium">교회 추가</button>
      </form>

      <div className="space-y-2">
        {churches.map(c => (
          <div key={c.id} className="flex items-center justify-between bg-white border border-[#EDEFF1] rounded-xl px-4 py-3">
            <div>
              <div className="font-medium text-sm">{c.name}</div>
              <div className="text-xs text-gray-400">{c.address}</div>
            </div>
            <button onClick={() => handleDelete(c.id)} className="text-xs text-red-500 hover:underline">삭제</button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 공간 대여 관리 페이지 생성**

`frontend/src/app/admin/spaces/page.tsx`:
```tsx
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { SpaceRental } from '@/types';

export default function AdminSpacesPage() {
  const [rentals, setRentals] = useState<SpaceRental[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRentals = () => {
    api.get('/admin/spaces/rentals').then(r => setRentals(r.data.data ?? [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchRentals(); }, []);

  const approve = async (id: number) => {
    await api.put(`/admin/spaces/rentals/${id}/approve`);
    fetchRentals();
  };

  const reject = async (id: number) => {
    const reason = prompt('거절 사유를 입력하세요');
    if (reason === null) return;
    await api.put(`/admin/spaces/rentals/${id}/reject`, { reason });
    fetchRentals();
  };

  if (loading) return <div className="p-6 text-gray-400">불러오는 중...</div>;

  const statusLabel: Record<string, string> = { PENDING: '대기중', APPROVED: '승인', REJECTED: '거절', CANCELLED: '취소' };
  const statusColor: Record<string, string> = { PENDING: 'text-amber-500', APPROVED: 'text-green-600', REJECTED: 'text-red-500', CANCELLED: 'text-gray-400' };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-6">공간 대여 신청 관리</h1>
      <div className="space-y-3">
        {rentals.map(r => (
          <div key={r.id} className="bg-white border border-[#EDEFF1] rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium text-sm">{r.spaceName}</div>
                <div className="text-xs text-gray-400 mt-0.5">{r.applicantNickname} · {r.contactPhone}</div>
                <div className="text-xs text-gray-500 mt-1">목적: {r.purpose}</div>
                <div className="text-xs text-gray-500">{r.startDateTime} ~ {r.endDateTime}</div>
              </div>
              <span className={`text-xs font-medium ${statusColor[r.status]}`}>{statusLabel[r.status]}</span>
            </div>
            {r.status === 'PENDING' && (
              <div className="flex gap-2 mt-3">
                <button onClick={() => approve(r.id)} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600">승인</button>
                <button onClick={() => reject(r.id)} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600">거절</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 물품 대여 관리 페이지 생성**

`frontend/src/app/admin/items/page.tsx`:
```tsx
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { ItemRental } from '@/types';

export default function AdminItemsPage() {
  const [rentals, setRentals] = useState<ItemRental[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRentals = () => {
    api.get('/admin/items/rentals').then(r => setRentals(r.data.data ?? [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchRentals(); }, []);

  const approve = async (id: number) => {
    await api.put(`/admin/items/rentals/${id}/approve`);
    fetchRentals();
  };

  const reject = async (id: number) => {
    const reason = prompt('거절 사유를 입력하세요');
    if (reason === null) return;
    await api.put(`/admin/items/rentals/${id}/reject`, { reason });
    fetchRentals();
  };

  const statusLabel: Record<string, string> = { PENDING: '대기중', APPROVED: '승인', REJECTED: '거절', CANCELLED: '취소' };
  const statusColor: Record<string, string> = { PENDING: 'text-amber-500', APPROVED: 'text-green-600', REJECTED: 'text-red-500', CANCELLED: 'text-gray-400' };

  if (loading) return <div className="p-6 text-gray-400">불러오는 중...</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-6">물품 대여 신청 관리</h1>
      <div className="space-y-3">
        {rentals.map(r => (
          <div key={r.id} className="bg-white border border-[#EDEFF1] rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium text-sm">{r.itemName} × {r.quantity}개</div>
                <div className="text-xs text-gray-400 mt-0.5">{r.applicantNickname} · {r.contactPhone}</div>
                <div className="text-xs text-gray-500 mt-1">{r.startDate} ~ {r.endDate}</div>
              </div>
              <span className={`text-xs font-medium ${statusColor[r.status]}`}>{statusLabel[r.status]}</span>
            </div>
            {r.status === 'PENDING' && (
              <div className="flex gap-2 mt-3">
                <button onClick={() => approve(r.id)} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600">승인</button>
                <button onClick={() => reject(r.id)} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600">거절</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: 웰컴 키트 신청 관리 페이지 생성**

`frontend/src/app/admin/welcome-kits/page.tsx`:
```tsx
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { WelcomeKit } from '@/types';

export default function AdminWelcomeKitsPage() {
  const [kits, setKits] = useState<WelcomeKit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchKits = () => {
    api.get('/admin/welcome/kits').then(r => setKits(r.data.data ?? [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchKits(); }, []);

  const markProcessed = async (id: number) => {
    await api.put(`/admin/welcome/kits/${id}/process`);
    fetchKits();
  };

  if (loading) return <div className="p-6 text-gray-400">불러오는 중...</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-6">웰컴 키트 신청 관리</h1>
      <div className="space-y-3">
        {kits.map(kit => (
          <div key={kit.id} className={`bg-white border rounded-xl p-4 ${kit.processed ? 'border-[#EDEFF1] opacity-60' : 'border-amber-200'}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium text-sm">{kit.name} · {kit.phone}</div>
                {kit.address && <div className="text-xs text-gray-400 mt-0.5">📍 {kit.address}</div>}
                {kit.message && <div className="text-xs text-gray-500 mt-1">"{kit.message}"</div>}
                <div className="text-xs text-gray-400 mt-1">{new Date(kit.createdAt).toLocaleDateString()}</div>
              </div>
              <span className={`text-xs font-medium ${kit.processed ? 'text-green-600' : 'text-amber-500'}`}>
                {kit.processed ? '처리 완료' : '미처리'}
              </span>
            </div>
            {!kit.processed && (
              <button onClick={() => markProcessed(kit.id)}
                className="mt-3 px-3 py-1.5 bg-[#003478] text-white rounded-lg text-xs font-medium hover:bg-blue-900 transition-colors">
                처리 완료 표시
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: 빌드 확인**

```bash
cd frontend
npm run build
```
Expected: 빌드 성공 (타입 에러 없음)

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app/admin/
git commit -m "feat: Admin 대시보드 — 교회·공간·물품·웰컴키트 관리 페이지 추가"
```

---

## 최종 확인

- [ ] **로컬 전체 실행 확인**

```bash
# 백엔드
cd backend && JAVA_HOME="/c/Users/taeyeop/.jdks/graalvm-jdk-21.0.7" ./gradlew bootRun &

# 프론트엔드
cd frontend && npm run dev
```

브라우저에서 확인:
- `http://localhost:3000` — 홈 랜딩
- `http://localhost:3000/welcome` — 웰컴 페이지
- `http://localhost:3000/churches` — 교회 소개
- `http://localhost:3000/events` — 행사 (카테고리 필터)
- `http://localhost:3000/spaces` — 공간 대여
- `http://localhost:3000/items` — 물품 대여
- `http://localhost:3000/faith` — 신앙 Q&A
- `http://localhost:3000/community` — 커뮤니티 게시판
- `http://localhost:3000/service` — 지역 섬김

- [ ] **최종 Commit + Deploy**

```bash
git add .
git commit -m "feat: 염리동 청년 커뮤니티 피벗 — 전체 프론트엔드 완성"
git push origin main
```
