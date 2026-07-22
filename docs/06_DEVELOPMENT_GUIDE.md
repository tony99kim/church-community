# 개발 가이드

## 개발 환경 요구사항

| 도구 | 버전 | 설치 확인 |
|------|------|-----------|
| Java JDK | 17+ | `java -version` |
| Node.js | 20+ | `node -v` |
| Git | 최신 | `git --version` |

> Docker 불필요 - DB(Supabase)와 Redis(Upstash)는 클라우드 서비스를 직접 사용합니다.

---

## 로컬 개발 환경 세팅

### 1. 환경변수 설정

```bash
cd backend
cp .env.example .env
# .env 파일에 Supabase/Upstash/JWT 값 입력
```

### 2. 백엔드 실행

```bash
cd backend
./gradlew bootRun
# http://localhost:8080
```

### 3. 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
# http://localhost:3000        (사용자 사이트)
# http://localhost:3000/admin  (관리자 사이트)
```

---

## 백엔드 패키지 구조

```
com.churchhub
├── config/
│   ├── SecurityConfig.java
│   ├── RedisConfig.java
│   └── CorsConfig.java
│
├── domain/
│   ├── user/          (entity, repository, service, dto, api)
│   ├── board/         (Post)
│   ├── comment/
│   ├── category/
│   ├── report/
│   └── notification/
│
├── security/
│   ├── JwtTokenProvider.java
│   ├── JwtAuthenticationFilter.java
│   └── CustomUserDetailsService.java
│
└── exception/
    ├── GlobalExceptionHandler.java
    ├── BusinessException.java
    └── ErrorCode.java
```

---

## Git 브랜치 전략

```
main        # 운영 배포 브랜치 (push 시 GitHub Actions가 Fly.io 자동 배포)
feature/*   # 기능 개발 브랜치
hotfix/*    # 긴급 버그 수정
```

### 커밋 메시지 규칙

```
feat: 회원가입 API 구현
fix: 댓글 카운트 버그 수정
docs: API 명세서 업데이트
refactor: JWT 토큰 검증 로직 개선
chore: Gradle 의존성 업데이트
```

---

## 구현 현황

### ✅ Phase 1 - MVP
- [x] 프로젝트 초기 설정 (Spring Boot + Supabase)
- [x] 회원가입 / 로그인 / JWT 인증
- [x] 게시판 카테고리 CRUD (관리자)
- [x] 게시글 CRUD
- [x] 댓글 / 대댓글 CRUD (cascade 삭제)
- [x] 관리자 페이지 (회원 관리, 게시글 관리, 카테고리 관리)

### ✅ Phase 2 - 기능 확장
- [x] 좋아요 기능
- [x] 검색 기능 (키워드 + 카테고리 필터)
- [x] 알림 기능 (댓글 알림)
- [x] 신고 기능 (게시글/댓글)
- [x] 페이지네이션 컴포넌트
- [x] SEO 메타태그 (og/twitter, 게시글별 동적 생성)
- [ ] 행사 등록 및 참여 신청
- [ ] 파일 첨부 (이미지 업로드)

### ❌ Phase 3 - 미구현
- [ ] 이메일 인증 / 비밀번호 찾기
- [ ] 관리자 통계 대시보드 고도화
- [ ] 비회원 공개 게시판 조회
