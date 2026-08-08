# 페이지별 개선 계획

> 작성일: 2026-08-08  
> Phase 1 (채팅 메시지), Phase 2 (DM 시스템) 완료 후 다음 단계로 진행할 프론트엔드 개선 목록.

---

## 우선순위 요약

| 우선순위 | 페이지 | 핵심 이유 |
|---|---|---|
| 높음 | `/messages` — `?convId` 파라미터 처리 | 신앙Q&A → 메시지 리다이렉트가 절반만 동작 |
| 높음 | `/welcome` — 중복 신청 방지 | 이미 신청한 유저에게 폼이 또 보임 |
| 높음 | `/community` — 검색, 공지 구분 | 핵심 기능 누락 |
| 중간 | `/events`, `/service` — 프로그레스 바, 뱃지 | 정보 밀도 개선 |
| 중간 | `/my` — 탭 뱃지, 캐시 | 자주 쓰는 페이지 |
| 낮음 | `/churches` — 검색, 필터 | 교회 수가 적으면 덜 급함 |
| 낮음 | `/items`, `/spaces` — 프로그레스 바 | 시각적 polish |

---

## 1. 홈 `/`

**파일**: `frontend/src/app/(site)/page.tsx`

**문제**
- 웰컴 테이블 배너가 하드코딩된 텍스트 (실제 행사와 연동 안 됨)
- "오늘의 인기글 🔥" 제목 — 실제로 오늘 기준이 아닌 전체 좋아요 순
- 스켈레톤 로딩 없음 (데이터 로드 전 빈 화면)
- 로그인 유저 대상 맞춤 멘트 없음

**개선**
- 웰컴 테이블 배너를 `WELCOME_TABLE` 카테고리 행사 API로 연동, 없으면 배너 숨김
  - `api.get('/events?category=WELCOME_TABLE&size=1&sort=startDate,asc')` 결과 사용
- "오늘의 인기글 🔥" → "인기글 🔥" (오늘 단어 제거)
- 각 섹션에 스켈레톤 카드 추가 (`animate-pulse` + `bg-gray-100` div)
- 로그인된 유저는 히어로에 `{user.nickname}님, 안녕하세요 👋` 표시

---

## 2. 처음 오셨나요? `/welcome`

**파일**: `frontend/src/app/(site)/welcome/page.tsx`

**문제**
- 이미 신청한 유저가 다시 방문하면 신청 폼이 또 표시됨
- 신청 완료 후 상태 추적 링크 없음
- Discord 링크가 placeholder (`YOUR_INVITE_CODE`)

**개선**
- 페이지 진입 시 `api.get('/welcome/kit/my')` 호출 → 이미 신청 내역 있으면 폼 대신 상태 표시
  ```
  신청 완료 ✓
  처리 상태: 처리 중 / 완료
  [마이페이지에서 확인하기 →]
  ```
- 완료 후 `/my` 링크 추가
- Discord 링크 `href` placeholder 제거 (표시 자체를 숨기거나 실제 URL로 교체)

---

## 3. 함께하는 교회 `/churches`

**파일**: `frontend/src/app/(site)/churches/page.tsx`

**문제**
- 검색/필터 없음
- 이미지 없는 교회에 placeholder 없음
- "청년부 있음" 필터 버튼 없음

**개선**
- 상단에 검색창 추가 — 프론트에서 `filter()` 처리 (API 추가 호출 없이)
  ```tsx
  const filtered = churches.filter(c =>
    c.name.includes(search) || c.address.includes(search)
  );
  ```
- "청년부 있음만 보기" 토글 버튼 → `c.hasYouthGroup` 필터
- 이미지 없는 교회 카드에 `⛪` 아이콘 배경 placeholder 추가

---

## 4. 교회 상세 `/churches/[id]`

**파일**: `frontend/src/app/(site)/churches/[id]/page.tsx`

**문제**
- 이 교회에서 이용 가능한 공간/행사 연결 없음
- 뒤로 가기가 `router.back()` — 직접 URL 접근 시 히스토리 없어서 동작 안 함

**개선**
- 뒤로 가기 `← 교회 목록`을 `<Link href="/churches">` 로 변경
- 하단에 "이 교회 공간 예약하기" 버튼 추가
  - `href={/spaces?churchId=${church.id}}` — 공간 목록 페이지에서 해당 교회 필터 필요

---

## 5. 행사 안내 `/events`

**파일**: `frontend/src/app/(site)/events/page.tsx`

**문제**
- 참여 신청 여부(`joined`)가 목록 카드에 표시 안 됨
- 페이지네이션 없음 (20개 고정)
- `SERVICE` 카테고리 제외가 프론트 `filter()` 처리라 불필요한 데이터 로드

**개선**
- 카드에 "✓ 신청함" 뱃지 추가 (로그인 + `event.joined === true`)
  ```tsx
  {isLoggedIn && event.joined && (
    <span className="text-xs bg-green-50 text-green-600 border border-green-100 px-2 py-0.5 rounded">✓ 신청함</span>
  )}
  ```
- `totalPages > 1` 시 기존 `Pagination` 컴포넌트 추가
- `SERVICE` 파라미터 제외 처리: API에 `excludeCategory=SERVICE` 파라미터가 없으면 프론트 필터 유지

---

## 6. 행사 상세 `/events/[id]`

**파일**: `frontend/src/app/(site)/events/[id]/page.tsx`

**문제**
- 인원 현황이 숫자만 표시 (`3/20명`)
- 신청/취소 성공 후 조용히 상태만 변경됨 (피드백 없음)

**개선**
- 인원 현황에 프로그레스 바 추가
  ```tsx
  {event.maxParticipants && (
    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
      <div className="bg-[#003478] h-1.5 rounded-full"
        style={{ width: `${Math.min(100, event.currentParticipants / event.maxParticipants * 100)}%` }} />
    </div>
  )}
  ```
- 신청/취소 성공 시 2초 토스트 메시지 상태로 표시
  ```tsx
  const [toast, setToast] = useState('');
  // 성공 후: setToast('신청 완료!'); setTimeout(() => setToast(''), 2000);
  ```

---

## 7. 커뮤니티 `/community`

**파일**: `frontend/src/app/(site)/community/page.tsx`

**문제**
- 검색 기능 없음
- 공지글(`notice: true`)이 일반 글과 구분 없음 — 상단 고정도 없음
- 게시글 목록에 조회수 미표시

**개선**
- 카테고리 탭 아래에 검색창 추가
  ```tsx
  <input placeholder="검색..." value={keyword} onChange={e => setKeyword(e.target.value)}
    onKeyDown={e => e.key === 'Enter' && fetchPosts()}
    className="w-full px-4 py-2 border border-[#EDEFF1] rounded-lg text-sm mb-4" />
  ```
  API: `?categoryId=X&keyword=검색어`
- 공지글에 `[공지]` 뱃지 추가 + 목록 최상단에 정렬
  ```tsx
  const sorted = [...posts].sort((a, b) => (b.notice ? 1 : 0) - (a.notice ? 1 : 0));
  ```
- 조회수 `👁 {post.viewCount}` 표시 추가

---

## 8. 게시글 상세 `/posts/[id]`

**파일**: `frontend/src/app/(site)/posts/[id]/page.tsx`

> 현재 33줄로 매우 빈약. 별도 컴포넌트에 위임하는 구조로 추정.  
> 실제 코드 확인 후 구체 개선안 결정.

---

## 9. 공간 대여 `/spaces`

**파일**: `frontend/src/app/(site)/spaces/page.tsx`

**문제**
- 이미지 없는 공간 카드에 placeholder 없음
- 내 예약 현황으로 바로 가는 링크 없음

**개선**
- 이미지 없을 때 `🏠` 아이콘 placeholder 배경 추가
  ```tsx
  {space.imageUrl ? (
    <img src={space.imageUrl} className="w-full h-32 object-cover rounded-t-xl" />
  ) : (
    <div className="w-full h-20 bg-blue-50 flex items-center justify-center text-3xl rounded-t-xl">🏠</div>
  )}
  ```
- 상단에 "내 예약은 마이페이지에서 확인" 링크 문구 추가

---

## 10. 공간 상세 `/spaces/[id]`

**파일**: `frontend/src/app/(site)/spaces/[id]/page.tsx` (286줄)

> 날짜+슬롯 선택 UI가 이미 있는 복잡한 페이지.  
> 실제 코드 리뷰 후 구체 개선안 작성.

---

## 11. 물품 대여 `/items`

**파일**: `frontend/src/app/(site)/items/page.tsx`

**문제**
- 재고 상태가 숫자만 표시 (`재고: 2/5개`)
- 재고 0인 카드가 다른 카드와 시각적으로 동일

**개선**
- 재고 프로그레스 바 추가 (공간 상세와 동일 패턴)
- 재고 0 카드 `opacity-60` 처리
  ```tsx
  <div className={`bg-white rounded-2xl border ... ${item.availableQuantity === 0 ? 'opacity-60' : ''}`}>
  ```

---

## 12. 물품 상세 `/items/[id]`

**파일**: `frontend/src/app/(site)/items/[id]/page.tsx` (93줄)

> 대여 신청 폼 페이지로 추정. 실제 코드 확인 후 개선안 작성.

---

## 13. 지역 섬김 `/service`

**파일**: `frontend/src/app/(site)/service/page.tsx`

**문제**
- 상태 필터 없음 (모집 중/종료 혼재)

**개선**
- "모집 중만 보기" 토글 버튼 추가 (프론트 필터)
  ```tsx
  const [activeOnly, setActiveOnly] = useState(false);
  const filtered = activeOnly
    ? events.filter(e => e.status === 'UPCOMING' || e.status === 'ONGOING')
    : events;
  ```

---

## 14. 봉사 상세 `/service/[id]`

**파일**: `frontend/src/app/(site)/service/[id]/page.tsx`

행사 상세(`/events/[id]`)와 동일한 개선 적용:
- 인원 현황 프로그레스 바
- 신청/취소 성공 시 토스트

---

## 15. 신앙 Q&A `/faith`

**파일**: `frontend/src/app/(site)/faith/page.tsx`

Phase 2에서 비공개 상담 탭 추가 완료. 추가 개선:

- 질문 카드에 "미답변" 뱃지 추가
  ```tsx
  {q.answers.length === 0 && (
    <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded">미답변</span>
  )}
  ```
- 질문 작성자 표시 개선: 익명이면 `익명` 칩, 실명이면 닉네임

---

## 16. 메시지 `/messages`

**파일**: `frontend/src/app/(site)/messages/page.tsx`

**문제 (높은 우선순위)**
- `/faith`에서 비공개 상담 완료 후 `/messages?convId=X`로 리다이렉트하지만, 현재 `?convId` 파라미터를 읽는 로직이 없음 → 그냥 빈 목록 화면이 뜸

**개선**
- `useSearchParams()`로 `convId` 읽어서 자동으로 해당 대화 오픈
  ```tsx
  const searchParams = useSearchParams();
  useEffect(() => {
    const convId = searchParams.get('convId');
    if (convId && conversations.length > 0) {
      openConversation(Number(convId));
    }
  }, [conversations, searchParams]);
  ```

---

## 17. 마이페이지 `/my`

**파일**: `frontend/src/app/(site)/my/page.tsx` (717줄)

**문제**
- 탭 8개로 모바일에서 가로 스크롤 필요
- 각 탭에 미확인 건수 뱃지 없음
- 탭 전환할 때마다 API 재호출 (캐시 없음)

**개선**
- 탭에 건수 뱃지 추가 (각 탭 첫 로드 후 count 저장)
  ```tsx
  <button>내 예약 {spaceRentals.length > 0 && <span className="...badge">{spaceRentals.length}</span>}</button>
  ```
- 탭 데이터를 `Map<Tab, data>` 패턴으로 캐시 — 같은 탭 재방문 시 API 재호출 없음
- 탭 순서 재정렬: `info → posts → spaceRentals → itemRentals → faithQuestions → prayers → welcomeKits → password`

---

## 18. 성경 `/bible`

**파일**: `frontend/src/app/(site)/bible/page.tsx` (366줄)

> 외부 성경 API 또는 내부 데이터로 구동되는 독립 뷰어.  
> 현재 동작 확인 후 개선안 작성. 크게 문제 없으면 그대로 유지.

---

## 19. 로그인 `/login`

**파일**: `frontend/src/app/(site)/login/page.tsx`

**문제**
- 로그인 실패 시 `alert()` 사용
- 비밀번호 표시/숨김 토글 없을 수 있음

**개선**
- `alert()` → 폼 아래 인라인 에러 메시지
  ```tsx
  {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
  ```
- 비밀번호 input에 `EyeIcon` 토글 추가 (마이페이지에 이미 `EyeIcon` 컴포넌트 구현되어 있음 — 재사용)

---

## 20. 회원가입 `/register`

**파일**: `frontend/src/app/(site)/register/page.tsx`

**문제**
- 에러 처리가 `alert()` 사용 가능성 있음
- 닉네임 중복 체크 타이밍 불명확

**개선**
- `alert()` → 인라인 에러 메시지 (로그인과 동일)
- 닉네임 중복 체크: input `onBlur` 시 즉시 확인 (`/api/v1/auth/check-nickname` 등 있으면 활용)

---

## 구현 순서 제안

1. `/messages` — `?convId` 파라미터 처리 (10분, 최우선)
2. `/community` — 검색창 + 공지 구분 (30분)
3. `/welcome` — 중복 신청 방지 (20분)
4. `/events` + `/service` — 프로그레스 바 + 뱃지 (30분)
5. `/my` — 탭 뱃지 (20분)
6. `/churches` — 검색 + 필터 (20분)
7. `/items` + `/spaces` — 시각적 polish (20분)
8. `/login` + `/register` — 인라인 에러 (15분)
