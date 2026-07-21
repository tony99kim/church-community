# 시스템 아키텍처

## 전체 구조 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                        │
│                                                             │
│   ┌─────────────────────┐   ┌─────────────────────────┐   │
│   │   사용자 사이트       │   │     관리자 사이트          │   │
│   │  (Next.js / React)  │   │       (React / Vite)    │   │
│   │  port: 3000         │   │       port: 3001        │   │
│   └──────────┬──────────┘   └───────────┬─────────────┘   │
└──────────────┼──────────────────────────┼─────────────────┘
               │                          │
               ▼                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      NGINX (Reverse Proxy)                  │
│                          port: 80 / 443                     │
│    /api/*  → Spring Boot                                    │
│    /admin-api/* → Spring Boot (admin prefix)                │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    SPRING BOOT (API Server)                  │
│                         port: 8080                          │
│                                                             │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│   │  Auth    │  │  Board   │  │  Event   │  │  Admin   │ │
│   │ Module   │  │ Module   │  │ Module   │  │ Module   │ │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
│                                                             │
│   ┌──────────────────────────────────────────────────────┐ │
│   │            Spring Security + JWT Filter              │ │
│   └──────────────────────────────────────────────────────┘ │
└───────────────────┬───────────────────────┬────────────────┘
                    │                       │
          ┌─────────▼──────┐    ┌──────────▼──────┐
          │   MySQL 8.x    │    │   Redis 7.x      │
          │  (메인 DB)      │    │  (캐시/세션)      │
          └────────────────┘    └─────────────────┘
```

## 모노레포 구조 (Monorepo)

```
church-community/
├── backend/                          # Spring Boot API 서버
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/churchhub/
│   │   │   │   ├── ChurchHubApplication.java
│   │   │   │   ├── config/           # 설정 클래스 (Security, Redis, CORS 등)
│   │   │   │   ├── domain/           # 도메인 엔티티
│   │   │   │   │   ├── user/
│   │   │   │   │   ├── board/
│   │   │   │   │   ├── event/
│   │   │   │   │   ├── comment/
│   │   │   │   │   ├── category/
│   │   │   │   │   └── notification/
│   │   │   │   ├── api/              # REST 컨트롤러
│   │   │   │   │   ├── user/
│   │   │   │   │   ├── board/
│   │   │   │   │   ├── event/
│   │   │   │   │   └── admin/
│   │   │   │   ├── service/          # 비즈니스 로직
│   │   │   │   ├── repository/       # JPA Repository
│   │   │   │   ├── dto/              # Data Transfer Objects
│   │   │   │   ├── exception/        # 예외 처리
│   │   │   │   ├── security/         # JWT, Security 관련
│   │   │   │   └── common/           # 공통 유틸, 응답 형식
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       ├── application-dev.yml
│   │   │       └── application-prod.yml
│   │   └── test/
│   ├── build.gradle
│   └── Dockerfile
│
├── frontend-user/                    # 사용자 사이트 (Next.js)
│   ├── src/
│   │   ├── app/                      # Next.js App Router
│   │   │   ├── (auth)/               # 인증 관련 페이지
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── (main)/               # 메인 레이아웃
│   │   │   │   ├── board/            # 커뮤니티 게시판
│   │   │   │   ├── event/            # 행사
│   │   │   │   ├── local/            # 지역 홍보
│   │   │   │   └── profile/          # 프로필
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/                      # API 클라이언트, 유틸
│   │   ├── store/                    # Zustand 상태
│   │   └── types/
│   ├── package.json
│   └── Dockerfile
│
├── frontend-admin/                   # 관리자 사이트 (React + Vite)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard/
│   │   │   ├── Users/
│   │   │   ├── Boards/
│   │   │   ├── Events/
│   │   │   └── Reports/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── store/
│   ├── package.json
│   └── Dockerfile
│
├── docs/                             # 프로젝트 문서
├── docker-compose.yml                # 로컬 개발 환경
├── docker-compose.prod.yml           # 운영 환경
└── README.md
```

## API 설계 원칙

- RESTful API 설계
- 모든 API 응답은 공통 포맷 사용
- JWT Access Token (15분) + Refresh Token (7일) 방식
- API 버전 관리: `/api/v1/...`
- 관리자 API 분리: `/api/v1/admin/...`

### 공통 응답 형식
```json
{
  "success": true,
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": { ... },
  "timestamp": "2026-01-01T00:00:00Z"
}
```

### 에러 응답 형식
```json
{
  "success": false,
  "message": "오류 메시지",
  "errorCode": "USER_NOT_FOUND",
  "timestamp": "2026-01-01T00:00:00Z"
}
```
