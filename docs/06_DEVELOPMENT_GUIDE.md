# 개발 가이드

## 개발 환경 요구사항

| 도구 | 버전 | 설치 확인 |
|------|------|-----------|
| Java JDK | 17+ | `java -version` |
| Gradle | 8.x | `gradle -version` |
| Node.js | 20+ | `node -v` |
| Docker Desktop | 최신 | `docker -v` |
| IntelliJ IDEA | 최신 | - |
| VS Code | 최신 | - |
| Git | 최신 | `git --version` |

---

## 로컬 개발 환경 세팅

### 1. Docker로 DB 실행

```bash
# 프로젝트 루트에서
docker-compose up -d mysql redis
```

### 2. 백엔드 실행

```bash
cd backend
./gradlew bootRun --args='--spring.profiles.active=dev'
```

### 3. 사용자 프론트 실행

```bash
cd frontend-user
npm install
npm run dev
# http://localhost:3000
```

### 4. 관리자 프론트 실행

```bash
cd frontend-admin
npm install
npm run dev
# http://localhost:3001
```

---

## 백엔드 패키지 구조 상세

```
com.churchhub
├── config/
│   ├── SecurityConfig.java          # Spring Security 설정
│   ├── JpaConfig.java               # JPA Auditing 설정
│   ├── RedisConfig.java             # Redis 설정
│   ├── CorsConfig.java              # CORS 설정
│   └── SwaggerConfig.java           # API 문서화
│
├── domain/
│   ├── user/
│   │   ├── entity/User.java
│   │   ├── repository/UserRepository.java
│   │   ├── service/UserService.java
│   │   ├── dto/UserDto.java
│   │   └── api/UserController.java
│   ├── board/
│   │   ├── entity/Post.java
│   │   ├── repository/PostRepository.java
│   │   ├── service/PostService.java
│   │   ├── dto/PostDto.java
│   │   └── api/PostController.java
│   ├── comment/
│   ├── category/
│   ├── event/
│   └── notification/
│
├── security/
│   ├── JwtTokenProvider.java        # JWT 생성/검증
│   ├── JwtAuthenticationFilter.java # 요청당 JWT 필터
│   ├── CustomUserDetails.java       # UserDetails 구현
│   └── CustomUserDetailsService.java
│
├── exception/
│   ├── GlobalExceptionHandler.java  # @ControllerAdvice
│   ├── BusinessException.java       # 비즈니스 예외 베이스
│   └── ErrorCode.java               # 에러 코드 Enum
│
└── common/
    ├── response/ApiResponse.java     # 공통 응답 래퍼
    ├── dto/PageDto.java              # 페이징 응답
    └── util/FileUtil.java            # 파일 유틸
```

---

## Git 브랜치 전략 (GitHub Flow 기반)

```
main           # 운영 배포 브랜치
develop        # 개발 통합 브랜치
feature/*      # 기능 개발 브랜치
  feature/user-auth
  feature/board-crud
  feature/event-management
hotfix/*       # 긴급 버그 수정
```

### 커밋 메시지 규칙

```
feat: 회원가입 API 구현
fix: 게시글 좋아요 중복 버그 수정
docs: API 명세서 업데이트
refactor: JWT 토큰 검증 로직 개선
test: 게시글 서비스 단위 테스트 추가
chore: Gradle 의존성 업데이트
```

---

## 개발 우선순위 (MVP → 확장)

### Phase 1 - MVP (핵심 기능)
- [ ] 프로젝트 초기 설정 (Spring Boot + DB)
- [ ] 회원가입 / 로그인 / JWT 인증
- [ ] 게시판 카테고리 CRUD (관리자)
- [ ] 게시글 CRUD (작성/조회/수정/삭제)
- [ ] 댓글 CRUD
- [ ] 기본 관리자 페이지 (회원 관리, 게시글 관리)

### Phase 2 - 기능 확장
- [ ] 좋아요 기능
- [ ] 행사 등록 및 참여 신청
- [ ] 파일 첨부 (이미지 업로드)
- [ ] 검색 기능
- [ ] 알림 기능

### Phase 3 - 고도화
- [ ] 이메일 인증 / 비밀번호 찾기
- [ ] 신고 기능
- [ ] 관리자 통계 대시보드
- [ ] Docker 컨테이너화
- [ ] CI/CD 파이프라인 구성

---

## 테스트 전략

```
단위 테스트 (Unit Test)
  - Service 레이어 비즈니스 로직 검증
  - Mockito 사용

통합 테스트 (Integration Test)
  - Repository 레이어 DB 쿼리 검증
  - @DataJpaTest 사용

API 테스트 (E2E Test)
  - Controller 레이어 HTTP 요청/응답 검증
  - @SpringBootTest + MockMvc 사용
```
