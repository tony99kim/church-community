# 배포 가이드

## 배포 구조

```
브라우저 → Vercel (Next.js, /api/v1/* rewrites) → Fly.io (Spring Boot) → Supabase (PostgreSQL, Storage)
                                                                   → Upstash (Redis)
```

| 서비스 | 플랫폼 | 주소 / 근거 |
|--------|--------|-------------|
| 프론트엔드 | Vercel | https://church-community-zeta.vercel.app (`fly.toml`의 CORS 값, README) |
| 백엔드 | Fly.io | https://churchhub-backend.fly.dev, 앱 `churchhub-backend`, 리전 `nrt` |
| DB | Supabase PostgreSQL | `DATABASE_URL` (Hikari에 풀러 대응용 `prepareThreshold=0` 설정) |
| 이미지 | Supabase Storage | 버킷 `church-community` |
| Redis | Upstash | 블랙리스트·OAuth 코드·조회수 중복 방지 (SSL) |

> 측정값 (저장소에 없음, 2026-10-07 측정): DB는 Supabase **풀러, ap-northeast-2(서울)** 리전. 백엔드는 도쿄(`nrt`)라 리전 간 왕복이 있음.

---

## 백엔드 — Fly.io (`backend/fly.toml`, `backend/Dockerfile`)

| 항목 | 값 |
|------|-----|
| 빌드 | Dockerfile 2단계: `gradle:8.7-jdk21-alpine`에서 `gradle bootJar` → `eclipse-temurin:21-jre-alpine`에서 실행 (`-XX:MaxRAMPercentage=75.0`) |
| VM | `shared` CPU 1개, 메모리 512MB |
| HTTP | 내부 포트 8080, `force_https = true` |
| 머신 | `auto_stop_machines = true`, `auto_start_machines = true`, `min_machines_running = 1` |
| 동시성 | requests 기준 soft 200 / hard 250 |
| `[env]` | `SPRING_PROFILES_ACTIVE=prod`, `SERVER_PORT=8080`, `CORS_ALLOWED_ORIGINS=https://church-community-zeta.vercel.app` |
| 헬스 체크 | `fly.toml`에 `[checks]` 없음. `/actuator/health`는 공개 |

prod 프로파일 주요 설정 (`application-prod.yml`): `lazy-initialization: true`, Hikari 최대 20 / 최소 5, Flyway `baseline-on-migrate`, Redis SSL, `forward-headers-strategy: native`, Swagger 비활성.

> **배포 중 중단 (측정값, 2026-10-07)**: 운영 머신이 1대이고 Spring 기동에 약 38초 걸려, 배포할 때마다 약 40~60초 동안 API 오류가 남. 프론트 axios는 GET만 5xx/네트워크 오류 시 최대 2회 재시도(1초, 2초)하므로 이 시간을 다 덮지는 못함. 사용자가 적은 시간에 배포할 것.

### 자동 배포 (`.github/workflows/deploy-backend.yml`)
- 트리거: `main` push 중 `backend/**` 변경, 또는 수동(`workflow_dispatch`: Actions → "Deploy Backend to Fly.io" → Run workflow)
- 동작: `flyctl deploy --remote-only` (작업 디렉토리 `backend`)
- CI(`ci.yml`) 통과를 기다리지 않고 병렬로 실행됨
- 필요한 GitHub Secret: `FLY_API_TOKEN` (값은 `fly tokens create deploy`로 발급)

### 수동 배포
```bash
cd backend
fly deploy --app churchhub-backend      # CLAUDE.md 기준. 원격 빌드는 --remote-only
```

### Fly secrets (이름만)
`fly secrets set NAME=...`으로 설정. 실제로 어떤 값이 들어가 있는지는 저장소에서 확인 불가.

| Secret | 필수 여부 (코드 기준) |
|--------|----------------------|
| `DATABASE_URL` | 필수 (기본값 없음) |
| `JWT_SECRET` | 필수 — prod에는 기본값이 없어 누락 시 기동 실패 |
| `SUPABASE_SERVICE_ROLE_KEY` | 필수 (기본값 없음, 업로드에 사용) |
| `REDIS_HOST`, `REDIS_PASSWORD` | 사실상 필수 (기본값 `localhost`/빈 값), `REDIS_PORT` 기본 6379 |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET` | 소셜 로그인에 필수 (기본값은 개발용 더미) |
| `OAUTH2_REDIRECT_URL` | 필수 (기본값 `http://localhost:3000/auth/callback`). 프론트 `https://<프론트 도메인>/auth/callback` |
| `SUPABASE_URL` | 선택 (prod 기본값 있음) |
| `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY` | 선택 (기본 1시간 / 30일) |

- 소셜 로그인 콜백은 백엔드 도메인의 `/login/oauth2/code/{google|kakao}` (Kakao는 `{baseUrl}/login/oauth2/code/kakao`로 명시). Google/Kakao 개발자 콘솔의 등록 값은 저장소에서 확인 불가

---

## 프론트엔드 — Vercel

- 저장소에 `vercel.json` 없음. 프로젝트 설정(Git 연동, Root Directory `frontend`, Next.js 프레임워크)은 Vercel 콘솔에 있어 저장소에서 확인 불가
- `CLAUDE.md`에는 수동 배포 명령 `npx vercel --prod`가 적혀 있음
- 관리자 사이트는 별도 배포 없이 같은 앱의 `/admin` 경로

### 환경변수
| Key | 의미 |
|-----|------|
| `NEXT_PUBLIC_API_URL` | 백엔드 **origin** (예: `https://churchhub-backend.fly.dev`). 끝에 `/api/v1`이 있어도 잘라냄. 없으면 위 주소가 기본값 |

`src/lib/config.ts` / `next.config.ts`에서 쓰임:
- `next.config.ts` rewrites: `/api/v1/:path*` → `${BACKEND_ORIGIN}/api/v1/:path*` (빌드 시점 값)
- 브라우저 `API_BASE` = `/api/v1` (같은 도메인), 서버 렌더링 `API_BASE` = `${BACKEND_ORIGIN}/api/v1`
- 소셜 로그인 버튼 링크 = `${BACKEND_ORIGIN}/oauth2/authorization/{provider}`

---

## CORS

- `CorsConfig`: `CORS_ALLOWED_ORIGINS`(쉼표 구분) 출처만 허용, 메서드 GET/POST/PUT/DELETE/PATCH/OPTIONS, 모든 헤더, credentials 허용, max-age 3600초
- 운영 값은 `fly.toml [env]`에 `https://church-community-zeta.vercel.app`로 들어 있음. 프론트 도메인이 바뀌면 이 값과 `OAUTH2_REDIRECT_URL`을 함께 바꿀 것
- 브라우저 API 호출은 Vercel 프록시를 거친 같은 도메인 요청이라 평소에는 CORS 검사를 받지 않음

---

## DB 마이그레이션

- 배포 시 앱 기동 과정에서 Flyway가 자동 적용 (`baseline-on-migrate: true`, baseline V1)
- 새 마이그레이션은 `V14__...sql`부터. 기동이 실패하면 배포 중단 시간이 길어지므로 CI 테스트(내장 Postgres에 전체 마이그레이션 적용)를 통과시킨 뒤 병합할 것
