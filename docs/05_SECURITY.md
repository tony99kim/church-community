# 보안 설계

## 인증/인가 구조

### JWT 토큰 전략
```
Access Token
  - 유효기간: 15분
  - 저장소: 메모리 (localStorage X → XSS 방어)
  - 전송: Authorization: Bearer {token}

Refresh Token
  - 유효기간: 7일
  - 저장소: HttpOnly Cookie (JavaScript 접근 불가 → XSS 방어)
  - 재발급: /auth/refresh 호출 시
  - 서버 측 Redis 저장 → 강제 로그아웃/토큰 무효화 가능

Token Blacklist
  - 로그아웃 시 Access Token을 Redis에 블랙리스트 등록 (남은 유효시간만큼 TTL)
```

### 권한 레벨
```
SUPER_ADMIN > ADMIN > USER
- SUPER_ADMIN: 모든 기능 + 관리자 권한 변경
- ADMIN: 회원/게시글/행사 관리
- USER: 일반 회원 기능
```

## 보안 체크리스트

### 입력 검증
- [ ] 모든 API 입력값 Bean Validation (@Valid)
- [ ] SQL Injection 방어 (JPA 파라미터 바인딩)
- [ ] XSS 방어 (입력값 Sanitize, Content Security Policy)
- [ ] 파일 업로드 타입/크기 제한

### 인증/인가
- [ ] BCrypt 비밀번호 해싱 (strength: 12)
- [ ] JWT Secret Key 환경변수 관리 (코드에 노출 금지)
- [ ] Refresh Token Rotation (재사용 방지)
- [ ] 로그인 실패 횟수 제한 (5회 → 30분 잠금)
- [ ] 비밀번호 정책 (8자 이상, 대소문자+숫자+특수문자)

### API 보안
- [ ] CORS 설정 (허용 도메인 명시적 지정)
- [ ] Rate Limiting (IP당 요청 수 제한)
- [ ] HTTPS 강제 (운영 환경)
- [ ] Sensitive 데이터 응답에서 제외 (password 등)

### 데이터 보안
- [ ] 개인정보 최소 수집
- [ ] 탈퇴 회원 데이터 처리 정책 (soft delete)
- [ ] 파일 저장 경로 외부 노출 금지
- [ ] 환경별 설정 분리 (dev/prod)

## Spring Security 설정 구조

```java
// 공개 API (인증 불필요)
.permitAll()
    "/api/v1/auth/**"
    "/api/v1/posts" (GET)
    "/api/v1/posts/{id}" (GET)
    "/api/v1/categories" (GET)
    "/api/v1/events" (GET)

// 인증 필요
.authenticated()
    "/api/v1/posts" (POST, PUT, DELETE)
    "/api/v1/comments/**"
    "/api/v1/users/me/**"
    "/api/v1/notifications/**"

// 관리자 전용
.hasRole("ADMIN")
    "/api/v1/admin/**"
```

## 파일 업로드 보안

```
허용 확장자: jpg, jpeg, png, gif, webp (이미지만)
최대 파일 크기: 5MB
저장 방식: UUID 기반 파일명 변경 (원본명 노출 금지)
저장 위치: 서버 외부 (S3 또는 별도 파일 서버 권장)
```

## 환경변수 목록

```properties
# 절대 코드에 하드코딩하지 말 것
JWT_SECRET=<256bit 이상 랜덤 시크릿>
JWT_ACCESS_EXPIRY=900000        # 15분 (ms)
JWT_REFRESH_EXPIRY=604800000    # 7일 (ms)

DB_URL=jdbc:mysql://localhost:3306/churchhub
DB_USERNAME=<DB 사용자>
DB_PASSWORD=<DB 비밀번호>

REDIS_HOST=localhost
REDIS_PORT=6379

MAIL_USERNAME=<이메일>
MAIL_PASSWORD=<앱 비밀번호>

FILE_UPLOAD_PATH=/uploads
```
