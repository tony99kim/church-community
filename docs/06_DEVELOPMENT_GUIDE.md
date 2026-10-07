# 개발 가이드

## 개발 환경 요구사항

| 도구 | 버전 | 근거 |
|------|------|------|
| Java JDK | 21 | `build.gradle` (`VERSION_21`), CI `temurin 21` |
| Gradle | 8.7 | `gradle-wrapper.properties`, CI, Dockerfile |
| Node.js | 22 (CI 기준) | `package.json`에 `engines` 없음, `ci.yml`이 Node 22 사용 |
| Docker | 선택 | 로컬 Postgres/Redis를 띄울 때만 (`docker-compose.yml`) |

> `gradle-wrapper.jar`는 `.gitignore`(`*.jar`) 때문에 저장소에 없음. 새로 클론하면 `./gradlew`가 동작하지 않으므로 Gradle 8.7을 설치해 `gradle ...`로 실행하거나 `gradle wrapper`로 jar를 만들어 쓸 것 (CI도 Gradle을 직접 설치함).

---

## 로컬 개발 환경 세팅

### 1. DB·Redis 준비
둘 중 하나:
- 로컬: `docker compose up postgres redis` (Postgres 16, Redis 7). dev 프로파일 기본값(`localhost:5432/churchhub`, 사용자 `postgres`)과 맞음. 비밀번호는 기본값이 비어 있으므로 compose 값에 맞춰 `DB_PASSWORD` 지정
- 클라우드: 개발용 Supabase/Upstash 주소를 환경변수로 지정

### 2. 환경변수
- 목록은 루트 `.env.example`과 05 문서 참고 (이름만, 값은 커밋 금지)
- Spring Boot는 `.env`를 자동으로 읽지 않음. 셸에서 `export` 하거나 IDE 실행 설정에 넣을 것
- dev 프로파일(기본): `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `REDIS_*`. 그 외는 개발용 기본값이 있음
- 이미지 업로드를 쓰려면 `SUPABASE_SERVICE_ROLE_KEY`, 소셜 로그인을 쓰려면 `GOOGLE_*`/`KAKAO_*` 실제 값 필요

### 3. 백엔드 실행

```bash
cd backend
gradle bootRun            # 또는 wrapper jar가 있으면 ./gradlew bootRun
# http://localhost:8080 , Swagger: http://localhost:8080/swagger-ui.html
```
- 기동 시 Flyway가 마이그레이션 적용, Hibernate는 `validate`로 엔티티와 스키마 일치만 확인

### 4. 프론트엔드 실행

```bash
cd frontend
npm install
# NEXT_PUBLIC_API_URL 을 지정하지 않으면 운영 백엔드(churchhub-backend.fly.dev)로 프록시됨
echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > .env.local
npm run dev
# http://localhost:3000        (사용자 사이트)
# http://localhost:3000/admin  (관리자 사이트)
```
- 인증 쿠키는 항상 `Secure`라서 `localhost`가 아닌 http 주소(예: LAN IP)로 접속하면 로그인 쿠키가 저장되지 않음

### 5. 테스트

```bash
cd backend
gradle test               # 또는 ./gradlew test
```
- `IntegrationTestBase`: `@SpringBootTest` + zonky 내장 PostgreSQL(16.4 바이너리, Docker 불필요)에 실제 Flyway 마이그레이션 적용, Redis(`StringRedisTemplate`)는 Mockito 목
- 테스트 6개 클래스: `AuthSecurityTest`(쿠키·정지 회원·소셜 코드), `AdminAccessTest`, `ChurchAccessTest`, `SpaceRentalTest`, `UploadControllerTest`, `RateLimitFilterTest`
- 프론트는 테스트 없음. 타입 체크 `npx tsc --noEmit`, 빌드 `npm run build`, 린트 `npm run lint`

### 6. CI (`.github/workflows/ci.yml`)
- 트리거: 모든 pull request, `main` push
- backend: Java 21 + Gradle 8.7 설치 → `gradle test --no-daemon`
- frontend: Node 22 → `npm ci` → `npx tsc --noEmit` → `npm run build` (린트는 CI에 없음)

---

## 백엔드 패키지 구조

```
com.churchhub
├── common/response/      ApiResponse
├── config/               SecurityConfig, CorsConfig, RedisConfig, WebConfig
├── domain/               admin, auth, board, category, church, comment, dm, event, faith,
│                         item, notification, report, space, upload, user, welcome
│                         (각각 api / dto / entity / repository / service)
├── security/             JwtTokenProvider, JwtAuthenticationFilter, RateLimitFilter,
│   │                     CustomUserDetails, CustomUserDetailsService
│   ├── access/           @AdminOnly, @FaithMinistry, @SuperAdminOnly
│   └── oauth2/           CustomOAuth2UserService, Google/KakaoOAuth2UserInfo, Success/FailureHandler
├── util/                 CookieUtil, ClientIpUtil
└── exception/            GlobalExceptionHandler, BusinessException, ErrorCode
```

---

## 코딩 규칙 (`CLAUDE.md`)

- API prefix: `/api/v1/`
- 응답 wrapper: `ApiResponse<T>` (`ApiResponse.success(...)`, 에러는 `BusinessException(ErrorCode.X)`)
- 관리자 패턴: 서비스 메서드가 `Long callerId`를 받아 `@Transactional` 안에서 `User`를 로드하고 역할·소속 교회 확인 (예: `CHURCH_MANAGER`는 자기 교회만)
- 권한은 `security/access`의 메타 애노테이션 사용, 역할 범위를 바꾸면 `UserRole`과 프론트 `src/lib/roles.ts`를 함께 수정
- DB 변경은 Flyway 마이그레이션으로만. 현재 V13까지 → **다음은 `V14__설명.sql`**
- 디자인 토큰: `#003478` (파랑), `#EDEFF1` (보더), `#f4f6f8` (배경)
- 프론트는 Next.js 16 — 기존 지식과 API가 다를 수 있으니 `node_modules/next/dist/docs/` 참고 (`frontend/AGENTS.md`)

---

## Git 브랜치 전략

```
main        # 운영 브랜치. backend/** 변경이 push되면 Fly.io 자동 배포, 프론트는 Vercel이 배포 (Git 연동 기준, 07 참고)
작업 브랜치  # PR로 main에 병합 (PR마다 CI 실행)
```

### 커밋 메시지
최근 커밋은 한국어 요약 + PR 번호 형식 (예: `목사·전도사도 교회 정보 관리, 자기 교회만 수정 (#2)`). 이전에는 `feat:`/`fix:`/`chore:` 접두어도 사용함.

---

## 현재 상태 (2026-10-07)

- 구현된 기능 전체는 01 문서 참고 (게시판, 행사, 교회, 공간·물품 대여, 신앙, DM, 알림, 신고, 웰컴 키트, 소셜 로그인, 관리자 화면)
- 미구현: 이메일 인증·비밀번호 찾기, 로그인 실패 잠금, 실시간 알림, 프론트 테스트
- 알려진 문제: 일부 로그인 필요 GET 엔드포인트가 비로그인 시 500 (04 ※), 일부 요청에 `@Valid` 누락 (05)
