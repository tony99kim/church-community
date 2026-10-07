# ChurchHub Frontend

Next.js 16 (App Router) 기반 프론트엔드 - 사용자 사이트와 관리자 사이트 통합.

## 로컬 실행

```bash
npm install
npm run dev
```

- 사용자 사이트: http://localhost:3000
- 관리자 사이트: http://localhost:3000/admin

## 환경변수

```bash
# 백엔드 주소 (끝의 /api/v1 은 있어도 없어도 됨)
NEXT_PUBLIC_API_URL=http://localhost:8080
```

브라우저는 같은 도메인의 `/api/v1/*` 를 부르고, `next.config.ts` 의 rewrites 가 백엔드로 넘깁니다.
인증 쿠키가 프론트 도메인에 `SameSite=Lax` 로 저장되어 CSRF 가 막히므로, API 를 백엔드 주소로 직접 부르지 마세요.

## 디렉토리 구조

```
src/
├── app/
│   ├── (site)/          # 사용자 페이지
│   │   ├── posts/       # 게시글 목록/상세
│   │   └── layout.tsx
│   ├── admin/           # 관리자 페이지
│   └── layout.tsx
├── components/          # 공통 컴포넌트
├── store/               # Zustand 스토어
└── lib/                 # API 클라이언트(api.ts), 설정(config.ts), 역할(roles.ts), 날짜(date.ts)
```
