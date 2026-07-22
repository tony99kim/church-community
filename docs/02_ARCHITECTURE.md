# 시스템 아키텍처

## 전체 구조

```
사용자/관리자 브라우저
        │
        ▼
┌───────────────────────┐
│  Vercel (Next.js 14)  │  https://church-community-zeta.vercel.app
│  - 사용자 사이트        │  /
│  - 관리자 사이트        │  /admin/*
└──────────┬────────────┘
           │ API 요청 (/api/v1/*)
           ▼
┌───────────────────────┐
│  Fly.io (Spring Boot) │  https://churchhub-backend.fly.dev
│  - REST API           │
│  - JWT 인증/인가       │
└────┬──────────────────┘
     │              │
     ▼              ▼
┌─────────┐   ┌──────────┐
│Supabase │   │ Upstash  │
│(PostgreSQL) │  (Redis) │
│ 메인 DB  │   │ 토큰 블랙 │
│          │   │ 리스트   │
└─────────┘   └──────────┘
```

## 모노레포 구조

```
church-community/
├── backend/                          # Spring Boot API 서버
│   ├── src/main/java/com/churchhub/
│   │   ├── ChurchHubApplication.java
│   │   ├── config/                   # SecurityConfig, RedisConfig, CorsConfig 등
│   │   ├── domain/
│   │   │   ├── user/
│   │   │   │   ├── entity/User.java
│   │   │   │   ├── repository/UserRepository.java
│   │   │   │   ├── service/UserService.java
│   │   │   │   ├── dto/UserDto.java
│   │   │   │   └── api/UserController.java
│   │   │   ├── board/               # Post (게시글)
│   │   │   ├── comment/
│   │   │   ├── category/
│   │   │   ├── report/              # 신고
│   │   │   └── notification/
│   │   ├── security/                # JwtTokenProvider, JwtAuthenticationFilter
│   │   └── exception/               # GlobalExceptionHandler, ErrorCode
│   ├── build.gradle
│   ├── Dockerfile
│   └── fly.toml
│
├── frontend/                         # Next.js 14 (사용자 + 관리자 통합)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (site)/               # 사용자 레이아웃 그룹
│   │   │   │   ├── posts/            # 게시글 목록/상세
│   │   │   │   └── layout.tsx
│   │   │   ├── (auth)/               # 로그인/회원가입
│   │   │   ├── admin/                # 관리자 페이지 (/admin/*)
│   │   │   │   ├── users/
│   │   │   │   ├── posts/
│   │   │   │   ├── categories/
│   │   │   │   └── reports/
│   │   │   └── layout.tsx
│   │   ├── components/               # 공통 컴포넌트
│   │   ├── store/                    # Zustand 스토어
│   │   └── lib/                      # API 클라이언트, 유틸
│   └── package.json
│
├── .github/workflows/
│   └── deploy-backend.yml            # GitHub Actions (Fly.io 자동 배포)
│
└── docs/
```

## API 설계 원칙

- RESTful API
- JWT Access Token (1시간) + Refresh Token (7일)
- API 버전 관리: `/api/v1/...`
- 관리자 API: `/api/v1/admin/...`

### 공통 응답 형식
```json
{
  "success": true,
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": { ... }
}
```

### 에러 응답 형식
```json
{
  "success": false,
  "message": "오류 메시지",
  "errorCode": "USER_NOT_FOUND"
}
```
