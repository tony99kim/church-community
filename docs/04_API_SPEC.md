# API 명세서

## 기본 정보
- Base URL: `http://localhost:8080/api/v1`
- 인증 방식: Bearer Token (JWT)
- Content-Type: `application/json`

---

## 1. 인증 API (`/auth`)

| Method | URL | 인증 | 설명 |
|--------|-----|------|------|
| POST | `/auth/register` | 불필요 | 회원가입 |
| POST | `/auth/login` | 불필요 | 로그인 |
| POST | `/auth/logout` | 필요 | 로그아웃 |
| POST | `/auth/refresh` | 불필요 | 토큰 재발급 |
| POST | `/auth/forgot-password` | 불필요 | 비밀번호 찾기 이메일 발송 |
| POST | `/auth/reset-password` | 불필요 | 비밀번호 재설정 |
| GET  | `/auth/check-email` | 불필요 | 이메일 중복 확인 |
| GET  | `/auth/check-nickname` | 불필요 | 닉네임 중복 확인 |

### 회원가입 요청/응답
```json
// POST /auth/register
// Request
{
  "email": "user@example.com",
  "password": "Password123!",
  "nickname": "청년1",
  "phone": "010-1234-5678"
}
// Response 201
{
  "success": true,
  "message": "회원가입이 완료되었습니다.",
  "data": { "userId": 1, "email": "user@example.com" }
}
```

### 로그인 요청/응답
```json
// POST /auth/login
// Request
{
  "email": "user@example.com",
  "password": "Password123!"
}
// Response 200
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci...",
    "tokenType": "Bearer",
    "expiresIn": 900
  }
}
```

---

## 2. 회원 API (`/users`)

| Method | URL | 인증 | 설명 |
|--------|-----|------|------|
| GET | `/users/me` | 필요 | 내 정보 조회 |
| PUT | `/users/me` | 필요 | 내 정보 수정 |
| PUT | `/users/me/password` | 필요 | 비밀번호 변경 |
| POST | `/users/me/profile-image` | 필요 | 프로필 이미지 업로드 |
| GET | `/users/{userId}/posts` | 불필요 | 특정 회원 게시글 목록 |

---

## 3. 카테고리 API (`/categories`)

| Method | URL | 인증 | 설명 |
|--------|-----|------|------|
| GET | `/categories` | 불필요 | 전체 카테고리 목록 |

---

## 4. 게시글 API (`/posts`)

| Method | URL | 인증 | 설명 |
|--------|-----|------|------|
| GET | `/posts` | 불필요 | 게시글 목록 (페이징, 필터링) |
| POST | `/posts` | 필요 | 게시글 작성 |
| GET | `/posts/{postId}` | 불필요 | 게시글 상세 조회 |
| PUT | `/posts/{postId}` | 필요 | 게시글 수정 (작성자만) |
| DELETE | `/posts/{postId}` | 필요 | 게시글 삭제 (작성자/관리자) |
| POST | `/posts/{postId}/like` | 필요 | 좋아요 토글 |
| POST | `/posts/{postId}/report` | 필요 | 게시글 신고 |
| GET | `/posts/search` | 불필요 | 게시글 검색 |

### 게시글 목록 Query Params
```
?categoryId=1       # 카테고리 필터
&page=0             # 페이지 번호 (0부터)
&size=10            # 페이지 크기
&sort=createdAt,desc  # 정렬 기준
&keyword=검색어      # 검색어
```

---

## 5. 댓글 API (`/posts/{postId}/comments`)

| Method | URL | 인증 | 설명 |
|--------|-----|------|------|
| GET | `/posts/{postId}/comments` | 불필요 | 댓글 목록 |
| POST | `/posts/{postId}/comments` | 필요 | 댓글 작성 |
| PUT | `/posts/{postId}/comments/{commentId}` | 필요 | 댓글 수정 |
| DELETE | `/posts/{postId}/comments/{commentId}` | 필요 | 댓글 삭제 |
| POST | `/posts/{postId}/comments/{commentId}/like` | 필요 | 댓글 좋아요 토글 |

---

## 6. 행사 API (`/events`)

| Method | URL | 인증 | 설명 |
|--------|-----|------|------|
| GET | `/events` | 불필요 | 행사 목록 |
| GET | `/events/{eventId}` | 불필요 | 행사 상세 |
| POST | `/events/{eventId}/join` | 필요 | 행사 참여 신청 |
| DELETE | `/events/{eventId}/join` | 필요 | 행사 참여 취소 |

---

## 7. 알림 API (`/notifications`)

| Method | URL | 인증 | 설명 |
|--------|-----|------|------|
| GET | `/notifications` | 필요 | 알림 목록 |
| PUT | `/notifications/{id}/read` | 필요 | 알림 읽음 처리 |
| PUT | `/notifications/read-all` | 필요 | 전체 알림 읽음 처리 |

---

## 8. 관리자 API (`/admin`)

| Method | URL | 인증 | 설명 |
|--------|-----|------|------|
| GET | `/admin/dashboard` | ADMIN | 대시보드 통계 |
| GET | `/admin/users` | ADMIN | 회원 목록 |
| PUT | `/admin/users/{userId}/status` | ADMIN | 회원 상태 변경 (정지/해제) |
| PUT | `/admin/users/{userId}/role` | SUPER_ADMIN | 권한 변경 |
| GET | `/admin/posts` | ADMIN | 전체 게시글 관리 |
| PUT | `/admin/posts/{postId}/status` | ADMIN | 게시글 상태 변경 |
| POST | `/admin/categories` | ADMIN | 카테고리 생성 |
| PUT | `/admin/categories/{id}` | ADMIN | 카테고리 수정 |
| DELETE | `/admin/categories/{id}` | ADMIN | 카테고리 삭제 |
| POST | `/admin/events` | ADMIN | 행사 등록 |
| PUT | `/admin/events/{eventId}` | ADMIN | 행사 수정 |
| GET | `/admin/reports` | ADMIN | 신고 목록 |
| PUT | `/admin/reports/{id}` | ADMIN | 신고 처리 |

---

## HTTP 상태 코드 정책

| 코드 | 의미 |
|------|------|
| 200 | 성공 |
| 201 | 생성 성공 |
| 400 | 잘못된 요청 (유효성 검사 실패 등) |
| 401 | 인증 필요 (토큰 없음/만료) |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |
| 409 | 충돌 (중복 이메일 등) |
| 500 | 서버 에러 |
