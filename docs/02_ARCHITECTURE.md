# 시스템 아키텍처

## 전체 구조

```
사용자/관리자 브라우저
        │  (모든 API 요청은 같은 도메인의 /api/v1/*)
        ▼
┌──────────────────────────────┐
│  Vercel (Next.js 16)         │  https://church-community-zeta.vercel.app
│  - 사용자 사이트  /           │
│  - 관리자 사이트  /admin/*    │
│  - rewrites: /api/v1/:path*  │──┐  next.config.ts
└──────────────────────────────┘  │  → ${BACKEND_ORIGIN}/api/v1/:path*
                                  ▼
┌──────────────────────────────┐
│  Fly.io (Spring Boot 3.2.5)  │  https://churchhub-backend.fly.dev
│  - REST API /api/v1/*        │
│  - JWT(쿠키) 인증/인가         │
│  - OAuth2 /oauth2/authorization/{google|kakao} (브라우저가 직접 접속)
└────┬───────────┬─────────┬───┘
     ▼           ▼         ▼
┌──────────┐ ┌────────┐ ┌──────────────────┐
│ Supabase │ │Upstash │ │ Supabase Storage │
│PostgreSQL│ │ Redis  │ │ 이미지 업로드      │
└──────────┘ └────────┘ └──────────────────┘
```

### 같은 도메인 프록시
- 브라우저는 `/api/v1/*`를 프론트 도메인으로 호출하고, Vercel이 `next.config.ts` rewrites로 Fly 백엔드에 넘김
- 그래서 `access_token`/`refresh_token` 쿠키가 프론트 도메인에 `SameSite=Lax`로 저장됨 (CSRF 방어, 05 참고)
- 서버 측 렌더링(`generateMetadata` 등)에는 프록시가 없어서 백엔드를 직접 호출 (`src/lib/config.ts`의 `API_BASE`)
- 소셜 로그인 시작 링크만 백엔드 주소(`BACKEND_ORIGIN/oauth2/authorization/...`)로 직접 이동

### Redis 사용처 (`StringRedisTemplate`)
| 키 | TTL | 용도 |
|----|-----|------|
| `bl:{accessToken}` | 토큰 남은 유효시간 | 로그아웃한 access 토큰 블랙리스트 (`AuthService.logout`, `JwtAuthenticationFilter`) |
| `oauth:code:{uuid}` | 60초 | 소셜 로그인 일회용 코드 → userId (`OAuthCodeStore`, `getAndDelete`로 1회만 사용) |
| `pv:{postId}:{u{userId}\|ip{ip}}` | 24시간 | 게시글 조회수 중복 방지 (`PostService`, Redis 장애 시 그냥 증가) |

- refresh 토큰은 Redis가 아니라 DB `refresh_tokens` 테이블에 저장
- `RedisConfig`에 `RedisCacheManager`(TTL 10분)가 등록되어 있으나 `@Cacheable` 사용처는 없음
- 요청 수 제한(`RateLimitFilter`)은 Redis가 아니라 인스턴스 메모리에 저장

## 모노레포 구조

```
church-community/
├── backend/                          # Spring Boot API 서버
│   ├── src/main/java/com/churchhub/
│   │   ├── ChurchHubApplication.java # @EnableJpaAuditing, @EnableScheduling
│   │   ├── common/response/          # ApiResponse
│   │   ├── config/                   # SecurityConfig, CorsConfig, RedisConfig, WebConfig(RestTemplate)
│   │   ├── domain/                   # 각 도메인: api / dto / entity / repository / service
│   │   │   ├── admin/                # 대시보드, 회원·게시글·카테고리·행사·신고 관리 (entity 없음)
│   │   │   ├── auth/                 # 로그인, RefreshToken, OAuthCodeStore, 만료 토큰 정리 스케줄러
│   │   │   ├── board/                # Post, PostLike
│   │   │   ├── category/
│   │   │   ├── church/
│   │   │   ├── comment/
│   │   │   ├── dm/                   # Conversation, ConversationMessage
│   │   │   ├── event/                # Event, EventParticipant
│   │   │   ├── faith/                # FaithQuestion, FaithAnswer, FaithQuestionMessage, PrayerRequest
│   │   │   ├── item/                 # Item, ItemRental, ItemRentalMessage
│   │   │   ├── notification/
│   │   │   ├── report/
│   │   │   ├── space/                # Space, SpaceRental, SpaceBlock
│   │   │   ├── upload/               # UploadController (Supabase Storage)
│   │   │   ├── user/
│   │   │   └── welcome/              # WelcomeKit
│   │   ├── security/                 # JwtTokenProvider, JwtAuthenticationFilter, RateLimitFilter,
│   │   │   │                         # CustomUserDetails(Service)
│   │   │   ├── access/               # @AdminOnly, @FaithMinistry, @SuperAdminOnly
│   │   │   └── oauth2/               # CustomOAuth2UserService, Google/Kakao UserInfo, Success/Failure 핸들러
│   │   ├── util/                     # CookieUtil, ClientIpUtil
│   │   └── exception/                # GlobalExceptionHandler, BusinessException, ErrorCode
│   ├── src/main/resources/
│   │   ├── application.yml / application-dev.yml / application-prod.yml
│   │   └── db/migration/             # Flyway V1~V13
│   ├── src/test/java/                # 통합 테스트 (내장 PostgreSQL)
│   ├── build.gradle, Dockerfile, fly.toml
│
├── frontend/                         # Next.js 16 (사용자 + 관리자 통합)
│   ├── next.config.ts                # /api/v1 rewrites
│   └── src/
│       ├── app/
│       │   ├── layout.tsx, error.tsx, not-found.tsx
│       │   ├── (site)/               # 사용자 레이아웃 그룹
│       │   │   ├── page.tsx          # 홈
│       │   │   ├── community/        # 커뮤니티 게시판
│       │   │   ├── posts/[id], posts/[id]/edit, posts/write
│       │   │   ├── events/[id]       # 행사
│       │   │   ├── service/[id]      # 지역 섬김 (행사 API 사용)
│       │   │   ├── churches/[id]
│       │   │   ├── spaces/[id]       # 공간 대여
│       │   │   ├── items/[id]        # 물품 대여
│       │   │   ├── faith/            # 신앙 Q&A·기도제목
│       │   │   ├── messages/         # DM
│       │   │   ├── welcome/          # 웰컴 키트
│       │   │   ├── my/               # 마이페이지
│       │   │   ├── login/, register/
│       │   │   └── privacy/, terms/
│       │   ├── auth/callback/        # 소셜 로그인 코드 교환
│       │   └── admin/                # /admin (layout.tsx에서 관리자 역할 확인)
│       │       ├── page.tsx          # 대시보드
│       │       ├── users/ posts/ categories/ reports/
│       │       ├── events/ service/ participants/
│       │       ├── churches/ spaces/ items/
│       │       └── faith/ welcome-kits/
│       ├── components/               # Header, Sidebar, ChatBox, RichEditor, Pagination, ReportModal,
│       │                             # RejectModal, Toast, UserAvatar, Providers, ui/(shadcn)
│       ├── context/                  # PendingCountsContext (관리자 사이드바 배지)
│       ├── lib/                      # api.ts(axios), config.ts, roles.ts, sanitize.ts, upload.ts, date.ts, utils.ts
│       ├── store/                    # authStore(Zustand, sessionStorage 캐시), categoryStore
│       └── types/
│
├── .github/workflows/
│   ├── ci.yml                        # PR·main push: 백엔드 테스트, 프론트 타입체크·빌드
│   └── deploy-backend.yml            # main의 backend/** 변경 시 Fly.io 배포
├── docker-compose.yml                # 로컬 postgres 16 / redis 7 / backend
├── .env.example
└── docs/
```

## API 설계 원칙

- RESTful API, 버전 prefix `/api/v1/...`
- 관리자 API: 대부분 `/api/v1/admin/...` (예외: 신앙 관리 `/api/v1/faith/admin/...`)
- 인증: HttpOnly 쿠키의 JWT (access 기본 1시간, refresh 기본 30일). `Authorization: Bearer` 헤더도 받음
- 페이지 목록은 Spring `Page` 그대로 반환 (`content`, `totalPages`, `number` 등)

### 공통 응답 형식 (`ApiResponse<T>`)
null 필드는 생략됨 (`@JsonInclude(NON_NULL)`).
```json
{
  "success": true,
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": { ... },
  "timestamp": "2026-10-07T12:00:00"
}
```

### 에러 응답 형식
```json
{
  "success": false,
  "message": "존재하지 않는 회원입니다.",
  "errorCode": "USER_NOT_FOUND",
  "timestamp": "2026-10-07T12:00:00"
}
```
- `BusinessException(ErrorCode)` → `ErrorCode`에 정의된 HTTP 상태 + `errorCode`
- 검증 실패·잘못된 JSON·필수 파라미터 누락 → 400 `INVALID_INPUT`
- `@PreAuthorize` 거부 → 비로그인 401 `UNAUTHORIZED`, 권한 부족 403 `FORBIDDEN`
- DB 오류 → 503 `DB_ERROR`, 지원하지 않는 메서드 → 405 `METHOD_NOT_ALLOWED`, 그 외 → 500 `INTERNAL_SERVER_ERROR`
- 예외
  - 인증 없이 보호 경로에 접근하면 Security 필터가 **본문 없이 401**만 반환 (`HttpStatusEntryPoint`)
  - 요청 수 초과 429는 `RateLimitFilter`가 직접 쓰며 필드명이 `code`임: `{"success":false,"message":"...","code":"TOO_MANY_REQUESTS"}`
