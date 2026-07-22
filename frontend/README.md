# ChurchHub Frontend

Next.js 14 (App Router) 기반 프론트엔드 - 사용자 사이트와 관리자 사이트 통합.

## 로컬 실행

```bash
npm install
npm run dev
```

- 사용자 사이트: http://localhost:3000
- 관리자 사이트: http://localhost:3000/admin

## 환경변수

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

## 디렉토리 구조

```
src/
├── app/
│   ├── (site)/          # 사용자 페이지
│   │   ├── posts/       # 게시글 목록/상세
│   │   └── layout.tsx
│   ├── (auth)/          # 로그인/회원가입
│   ├── admin/           # 관리자 페이지
│   └── layout.tsx
├── components/          # 공통 컴포넌트
├── store/               # Zustand 스토어
└── lib/                 # API 클라이언트
```
