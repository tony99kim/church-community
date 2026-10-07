# 보안 설계

> 2026-10-07 기준 코드에서 확인한 내용. "구현 / 미구현"으로 정리함.

## 인증/인가 구조

### JWT 토큰 전략 (`JwtTokenProvider`, `CookieUtil`, `AuthService`)
```
Access Token
  - 유효기간: JWT_ACCESS_EXPIRY (기본 3600000ms = 1시간), claim: sub=userId, role, type=access
  - 저장소: HttpOnly 쿠키 access_token (JavaScript 접근 불가)
  - 전송: 쿠키 우선, 없으면 Authorization: Bearer {token}

Refresh Token
  - 유효기간: JWT_REFRESH_EXPIRY (기본 2592000000ms = 30일), claim: type=refresh
  - 저장소: HttpOnly 쿠키 refresh_token + DB refresh_tokens 테이블 (token, user_id, expires_at)
  - 재발급: POST /auth/refresh → 기존 토큰 삭제 후 새 토큰 발급 (회전)
  - 만료 토큰 정리: 매일 03:00 (RefreshTokenCleanupScheduler)

쿠키 속성 (공통): HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age = 각 토큰 유효기간
서명: HMAC-SHA (jjwt 0.12.5, JWT_SECRET 바이트로 키 생성)

로그아웃 (POST /auth/logout)
  - 해당 회원의 refresh 토큰 전부 DB에서 삭제
  - access 토큰을 Redis `bl:{token}`에 남은 유효시간만큼 등록 → 필터가 거부
  - 두 쿠키 삭제 (Max-Age=0)
```
- 로그인 응답 `data`에도 `accessToken`/`refreshToken`이 들어 있음 (프론트는 쓰지 않고 쿠키만 사용)

### CSRF 방어
- Spring Security `csrf`는 끔 (STATELESS)
- 대신 브라우저는 프론트 도메인의 `/api/v1/*`만 호출하고 Vercel rewrites가 백엔드로 넘김 → 쿠키가 프론트 도메인에 `SameSite=Lax`로 저장되어 다른 사이트에서 보낸 POST/PUT/DELETE에는 쿠키가 실리지 않음

### 소셜 로그인 (Google, Kakao)
1. 브라우저가 백엔드 `/oauth2/authorization/{google|kakao}`로 이동 (Kakao는 `prompt=login` 추가, scope `profile_nickname`)
2. `CustomOAuth2UserService`: `provider + providerId`로 회원 조회, 없으면 생성 (같은 이메일의 기존 계정이 있으면 거부, 이메일이 없으면 placeholder 이메일). 정지·탈퇴 계정은 거부
3. `OAuth2SuccessHandler`: Redis에 60초짜리 일회용 코드(`oauth:code:{uuid}`) 저장 후 `OAUTH2_REDIRECT_URL?code=...`로 리다이렉트 (토큰을 URL에 싣지 않음)
4. 프론트 `/auth/callback`이 같은 도메인으로 `POST /api/v1/auth/oauth/exchange` → 코드를 `getAndDelete`로 1회 소비하고 쿠키 설정
5. 실패 시 `/auth/callback?error=oauth_failed`

### 정지·탈퇴 회원 차단
- `JwtAuthenticationFilter`: 매 요청 DB에서 회원을 읽어 `ACTIVE`가 아니면 인증하지 않음 (토큰이 남아 있어도)
- `/auth/refresh`: 회원이 `ACTIVE`가 아니면 refresh 토큰 전부 삭제 후 403 `ACCOUNT_SUSPENDED`
- 로그인·소셜 로그인·코드 교환에서도 거부
- 관리자가 상태를 `ACTIVE` 외로 바꾸거나 회원을 삭제하면 refresh 토큰 전부 삭제

### 권한 레벨 (`UserRole`, `security/access/*`)
```
SUPER_ADMIN   @SuperAdminOnly  회원 삭제·역할 변경, 교회 생성/삭제 + 아래 전부
PASTOR        @FaithMinistry   신앙 Q&A 답변·전체 조회, 기도제목 관리 + 관리자 화면
EVANGELIST    @FaithMinistry   PASTOR와 같음
CHURCH_MANAGER @AdminOnly      관리자 화면. 행사·공간·물품·대여는 자기 교회만 (서비스에서 callerId로 확인)
USER                           일반 회원 기능
```
- `/api/v1/admin/**`는 `SecurityConfig`에서 관리자 4개 역할만 허용, 개별 메서드는 메타 애노테이션(`@AdminOnly`, `@FaithMinistry`, `@SuperAdminOnly`)으로 추가 제한
- 교회 정보 수정은 `SUPER_ADMIN` 외에는 자기 소속 교회만
- `@PreAuthorize` 거부(`AccessDeniedException`)는 `GlobalExceptionHandler`가 비로그인 401 / 로그인 403으로 응답
- 보호 경로에 비로그인 접근 시 Security 진입점이 본문 없는 401 반환

## Spring Security 설정 구조 (`SecurityConfig`)

```java
// 공개 (permitAll)
"/api/v1/auth/**"
"/oauth2/**", "/login/oauth2/**"
GET "/api/v1/posts/**", "/api/v1/categories/**", "/api/v1/events/**", "/api/v1/comments/**",
    "/api/v1/churches/**", "/api/v1/spaces/**", "/api/v1/items/**", "/api/v1/faith/**"
POST "/api/v1/welcome/kit"            // 컨트롤러의 @PreAuthorize("isAuthenticated()")로 다시 막음
"/swagger-ui.html", "/swagger-ui/**", "/api-docs/**", "/webjars/**"   // 운영에선 springdoc 자체가 꺼짐
"/actuator/health"

// 관리자
"/api/v1/admin/**" → hasAnyRole(PASTOR, EVANGELIST, CHURCH_MANAGER, SUPER_ADMIN)

// 그 외 전부
anyRequest().authenticated()
```
- 공개 GET 경로 안에서 로그인이 필요한 엔드포인트는 `@PreAuthorize("isAuthenticated()")`나 `@FaithMinistry`로 막음 (예: `/faith/questions/my`, `/faith/admin/**`)
- 단, `GET /items/rentals/my`, `/items/rentals/{id}/messages`, `/spaces/rentals/my`는 애노테이션이 없어 비로그인 호출 시 500 (04 ※ 참고)

## 요청 수 제한 (`RateLimitFilter`, Bucket4j)

| 등급 | 경로 | 한도 (IP당) |
|------|------|-------------|
| LOGIN | `/api/v1/auth/login`, `/api/v1/auth/register` | 분당 10회 |
| AUTH | 그 밖의 `/api/v1/auth/**` | 분당 60회 |
| GENERAL | 나머지 전부 | 분당 200회 |

- 초과 시 429 `{"success":false,"message":"...","code":"TOO_MANY_REQUESTS"}`
- IP는 `X-Forwarded-For` 첫 값 (`ClientIpUtil`, Vercel이 실제 클라이언트 IP로 덮어쓴다는 전제). 버킷은 인스턴스 메모리에 있고 10분 미사용 시 정리
- 한계: Fly 주소로 직접 요청하면 `X-Forwarded-For`를 임의로 넣을 수 있음. 여러 인스턴스 간 공유되지 않음

## 파일 업로드 보안 (`UploadController`)

```
인증: 로그인 필요
허용 형식: jpg, png, gif, webp — 파일명·Content-Type이 아니라 매직 바이트로 판별
최대 크기: 파일 5MB / 요청 10MB (spring.servlet.multipart)
저장 방식: UUID 파일명 + 판별된 확장자, Supabase Storage 버킷 church-community (service role 키로 업로드)
반환: 공개 URL (버킷 공개 여부는 Supabase 콘솔 설정이라 저장소에서 확인 불가)
```

## 보안 체크리스트 (현재 상태)

### 입력 검증
- [x] Bean Validation(`@Valid`) — 대부분의 생성 요청에 적용
- [ ] `@Valid` 미적용 요청 존재: `PUT /users/me`, `PUT /posts/{id}`, 신고 생성, 관리자 상태/역할 변경, 반려 사유 등
- [x] SQL Injection 방어 — JPA 파라미터 바인딩, JPQL 파라미터, Specification
- [~] XSS — 게시글 HTML을 프론트에서 DOMPurify로 정화해 렌더 (`lib/sanitize.ts`, SSR 중에는 빈 문자열). 서버 측 정화와 CSP는 없음
- [x] 파일 업로드 타입(매직 바이트)/크기 제한

### 인증/인가
- [x] BCrypt 비밀번호 해싱 (strength 12)
- [x] JWT Secret 환경변수 관리 — 운영 프로파일은 기본값 없음(누락 시 기동 실패). 기본 `application.yml`에는 개발용 기본값이 있음
- [x] Refresh Token Rotation (재발급 시 이전 토큰 삭제)
- [ ] 탈취된 refresh 토큰 재사용 감지(토큰 계열 전체 폐기) — 없음, 삭제된 토큰은 단순히 401
- [ ] 로그인 실패 횟수 기반 계정 잠금 — 없음 (IP당 분당 10회 제한만)
- [x] 비밀번호 정책 — 회원가입·비밀번호 변경: 8자 이상, 소문자+대문자+숫자+특수문자(`@$!%*?&`) 각 1개 이상, 허용 문자는 영문·숫자·`@$!%*?&`만
- [x] 정지·탈퇴 회원 즉시 차단 (필터, refresh)
- [ ] 이메일 인증 / 비밀번호 재설정 — 없음

### API 보안
- [x] CORS — `CORS_ALLOWED_ORIGINS`에 명시한 출처만, credentials 허용 (브라우저 요청은 같은 도메인 프록시라 보통 CORS를 거치지 않음)
- [x] CSRF — SameSite=Lax 쿠키 + 같은 도메인 프록시
- [x] Rate Limiting (IP당, 3단계)
- [x] HTTPS — Fly `force_https = true`, 쿠키 `Secure`
- [x] 응답에서 비밀번호 제외 (`UserDto.Response`에 password 없음)
- [x] 운영에서 Swagger 비활성, health 상세 숨김
- [~] 보안 헤더 — Spring Security 기본 헤더만, CSP 없음

### 데이터 보안
- [x] 탈퇴·관리자 삭제 시 개인정보 익명화 (이메일·닉네임·이름·전화·프로필·비밀번호), 상태 DELETED
- [x] 게시글은 상태값(ACTIVE/HIDDEN/DELETED)으로 숨김/삭제
- [x] 환경별 설정 분리 (`application-dev.yml`, `application-prod.yml`)
- [x] 업로드 파일명 UUID (원본 파일명 미사용)

## 환경변수 목록 (이름만, 값은 절대 커밋 금지)

```properties
# 공통 (application.yml)
SPRING_PROFILES_ACTIVE      # 기본 dev, Fly에서는 prod
DDL_AUTO                    # 기본 validate (prod는 none 고정)
JWT_SECRET                  # 256bit 이상. prod 필수
JWT_ACCESS_EXPIRY           # ms, 기본 1시간
JWT_REFRESH_EXPIRY          # ms, 기본 30일
REDIS_HOST / REDIS_PORT / REDIS_PASSWORD
REDIS_SSL                   # 기본 false (prod는 SSL 강제)
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
KAKAO_CLIENT_ID / KAKAO_CLIENT_SECRET
CORS_ALLOWED_ORIGINS        # 쉼표 구분
OAUTH2_REDIRECT_URL         # 프론트 /auth/callback 주소

# prod (application-prod.yml)
DATABASE_URL                # JDBC URL, 필수
SUPABASE_URL                # 기본값 있음
SUPABASE_SERVICE_ROLE_KEY   # 필수 (업로드)

# dev (application-dev.yml)
DB_URL / DB_USERNAME / DB_PASSWORD
SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY

# Fly fly.toml [env] 로 지정됨
SERVER_PORT                 # 8080

# 프론트엔드
NEXT_PUBLIC_API_URL         # 백엔드 주소 (끝의 /api/v1 있어도 됨)
```
