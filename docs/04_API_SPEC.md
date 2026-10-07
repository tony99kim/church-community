# API 명세서

## 기본 정보
- Base URL
  - 브라우저: 프론트와 같은 도메인의 `/api/v1` (Vercel rewrites로 백엔드에 전달)
  - 백엔드 직접: `https://churchhub-backend.fly.dev/api/v1`, 로컬 `http://localhost:8080/api/v1`
- 인증: `access_token` HttpOnly 쿠키 (없으면 `Authorization: Bearer {token}` 헤더도 인정)
- Content-Type: `application/json` (업로드만 `multipart/form-data`)
- 응답: `ApiResponse<T>` (`success`, `message`, `data`, `errorCode`, `timestamp`) — 02 참고
- Swagger UI: 개발 환경 `/swagger-ui.html`, `/api-docs` (운영에서는 비활성)

### 인증 표기
| 표기 | 의미 |
|------|------|
| 공개 | 로그인 불필요 |
| 로그인 | 인증된 회원 (`SecurityConfig`의 `anyRequest().authenticated()` 또는 `@PreAuthorize("isAuthenticated()")`) |
| 관리자 | `PASTOR`, `EVANGELIST`, `CHURCH_MANAGER`, `SUPER_ADMIN` (`/api/v1/admin/**` 경로 규칙 또는 `@AdminOnly`) |
| 목회자 | `PASTOR`, `EVANGELIST`, `SUPER_ADMIN` (`@FaithMinistry`) |
| 최고관리자 | `SUPER_ADMIN` (`@SuperAdminOnly`) |
| 교회 범위 | `CHURCH_MANAGER`는 자기 소속 교회 데이터만 조회·수정 (서비스에서 `callerId`로 확인) |

> ※ 표시: `GET` 공개 경로 규칙(`/api/v1/items/**`, `/api/v1/spaces/**`) 아래에 있지만 실제로는 로그인 사용자가 필요한 엔드포인트. `@PreAuthorize`가 없어 비로그인으로 부르면 401이 아니라 500이 남.

---

## 1. 인증 (`/auth`) — `AuthController`

| Method | URL | 인증 | 설명 |
|--------|-----|------|------|
| POST | `/auth/register` | 공개 | 회원가입 (201). `email`, `password`, `name`, `nickname`, `phone` |
| POST | `/auth/login` | 공개 | 로그인. 쿠키 설정 + `data`에 토큰·사용자 정보 |
| POST | `/auth/logout` | 로그인 | refresh 토큰 전부 삭제, access 토큰 블랙리스트, 쿠키 삭제 |
| POST | `/auth/refresh` | 공개 (refresh 쿠키) | 토큰 재발급(회전), 쿠키 재설정 |
| POST | `/auth/oauth/exchange` | 공개 | `{ "code" }` 소셜 로그인 일회용 코드 → 쿠키 설정 |
| GET | `/auth/check-email?email=` | 공개 | 사용 가능하면 `true` |
| GET | `/auth/check-nickname?nickname=` | 공개 | 사용 가능하면 `true` |

소셜 로그인 (Spring Security, `/api/v1` 밖, 백엔드 도메인으로 직접 이동)

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/oauth2/authorization/google`, `/oauth2/authorization/kakao` | 로그인 시작 (Kakao는 `prompt=login` 추가) |
| GET | `/login/oauth2/code/{provider}` | 콜백 → `OAUTH2_REDIRECT_URL?code=...`(성공) / `?error=oauth_failed`(실패)로 리다이렉트 |

### 로그인 응답 예
```json
{
  "success": true,
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": {
    "accessToken": "eyJ...", "refreshToken": "eyJ...", "tokenType": "Bearer", "expiresIn": 3600,
    "userId": 1, "email": "user@example.com", "nickname": "청년1", "role": "USER", "profileImageUrl": null
  }
}
```

---

## 2. 회원 (`/users`) — `UserController`

| Method | URL | 인증 | 설명 |
|--------|-----|------|------|
| GET | `/users/me` | 로그인 | 내 정보 |
| PUT | `/users/me` | 로그인 | 닉네임·이름·전화·프로필 이미지 수정 |
| PUT | `/users/me/password` | 로그인 | 비밀번호 변경 (소셜 계정 불가) |
| DELETE | `/users/me` | 로그인 | 탈퇴(익명화). 이메일 계정은 본문 `{ "password" }` 필요 |
| GET | `/users/{userId}/posts` | 로그인 | 회원 게시글 (페이지, 기본 10개 최신순) |
| GET | `/users/pastors` | 로그인 | 목사·전도사 목록 (DM 대상) |
| GET | `/users/search?keyword=` | 로그인 | 닉네임 검색 (최대 10명, 본인 제외) |

---

## 3. 카테고리 (`/categories`) — `CategoryController`

| Method | URL | 인증 | 설명 |
|--------|-----|------|------|
| GET | `/categories` | 공개 | 카테고리 목록 (평탄) |
| GET | `/categories/tree` | 공개 | 상위 + 자식 트리 |
| GET | `/categories/{parentId}/children` | 공개 | 자식 카테고리 |

---

## 4. 게시글 (`/posts`) — `PostController`

| Method | URL | 인증 | 설명 |
|--------|-----|------|------|
| GET | `/posts?categoryId=&keyword=&page=&size=&sort=` | 공개 | 목록 (기본 10개, `createdAt,desc`) |
| GET | `/posts/{postId}` | 공개 | 상세 (조회수 24시간 1회 증가, 로그인 시 `liked` 포함) |
| POST | `/posts` | 로그인 | 작성 (201). NOTICE 카테고리는 관리자만 |
| PUT | `/posts/{postId}` | 로그인 | 수정 (작성자) |
| DELETE | `/posts/{postId}` | 로그인 | 삭제 (작성자 또는 관리자) |
| POST | `/posts/{postId}/like` | 로그인 | 좋아요 토글 (`data`: 좋아요 상태) |

## 5. 댓글 (`/posts/{postId}/comments`) — `CommentController`

| Method | URL | 인증 | 설명 |
|--------|-----|------|------|
| GET | `/posts/{postId}/comments` | 공개 | 댓글 목록 |
| POST | `/posts/{postId}/comments` | 로그인 | 작성 (201, 대댓글은 부모 ID 지정) |
| PUT | `/posts/{postId}/comments/{commentId}` | 로그인 | 수정 (작성자) |
| DELETE | `/posts/{postId}/comments/{commentId}` | 로그인 | 삭제 (작성자 또는 관리자) |

## 6. 신고 (`/reports`) — `ReportController`

| Method | URL | 인증 | 설명 |
|--------|-----|------|------|
| POST | `/reports` | 로그인 | 신고 (`type`: POST / COMMENT / USER, `targetId`, `reason`) |

## 7. 알림 (`/notifications`) — `NotificationController`

| Method | URL | 인증 | 설명 |
|--------|-----|------|------|
| GET | `/notifications` | 로그인 | 내 알림 목록 |
| GET | `/notifications/unread-count` | 로그인 | `{ "count": n }` |
| PUT | `/notifications/{id}/read` | 로그인 | 읽음 처리 (본인 것만) |
| PUT | `/notifications/read-all` | 로그인 | 전체 읽음 |

## 8. DM (`/conversations`) — `DmController`

| Method | URL | 인증 | 설명 |
|--------|-----|------|------|
| GET | `/conversations` | 로그인 | 내 대화방 (미리보기·미읽음 수) |
| POST | `/conversations` | 로그인 | 대화 시작 (`recipientId`, `initialMessage`, 선택 `faithQuestionId`) |
| GET | `/conversations/{id}/messages` | 로그인 | 메시지 목록 |
| POST | `/conversations/{id}/messages` | 로그인 | 메시지 전송 |
| GET | `/conversations/unread-count` | 로그인 | 미읽음 수 |

## 9. 행사 (`/events`) — `EventController`

| Method | URL | 인증 | 설명 |
|--------|-----|------|------|
| GET | `/events?category=&page=&size=` | 공개 | 목록 (기본 10개, `startDate,asc`) |
| GET | `/events/{eventId}` | 공개 | 상세 (로그인 시 신청 여부 포함) |
| POST | `/events/{eventId}/join` | 로그인 | 참여 신청 (201) |
| DELETE | `/events/{eventId}/join` | 로그인 | 참여 취소 |

## 10. 교회 — `ChurchController`

| Method | URL | 인증 | 설명 |
|--------|-----|------|------|
| GET | `/churches` | 공개 | 공개 교회 목록 |
| GET | `/churches/{id}` | 공개 | 교회 상세 |

## 11. 공간 대여 — `SpaceController`

| Method | URL | 인증 | 설명 |
|--------|-----|------|------|
| GET | `/spaces` | 공개 | 공간 목록 |
| GET | `/spaces/{id}` | 공개 | 공간 상세 |
| GET | `/spaces/{id}/slots?date=YYYY-MM-DD` | 공개 | 날짜별 시간 슬롯 (예약·차단 반영) |
| POST | `/spaces/{id}/rentals` | 로그인 | 대여 신청 (과거 시간·차단·중복 시 거부) |
| PUT | `/spaces/rentals/{rentalId}/cancel` | 로그인 | 신청 취소 (승인된 건 불가) |
| GET | `/spaces/rentals/my` | 로그인 ※ | 내 대여 신청 |

## 12. 물품 대여 — `ItemController`

| Method | URL | 인증 | 설명 |
|--------|-----|------|------|
| GET | `/items` | 공개 | 물품 목록 |
| POST | `/items/{id}/rentals` | 로그인 | 대여 신청 (재고·약관 동의 확인) |
| GET | `/items/rentals/my` | 로그인 ※ | 내 대여 신청 |
| PUT | `/items/rentals/{rentalId}/cancel` | 로그인 | 신청 취소 |
| GET | `/items/rentals/{rentalId}/messages` | 로그인 ※ | 대여 건 채팅 조회 (신청자 또는 관리자) |
| POST | `/items/rentals/{rentalId}/messages` | 로그인 | 대여 건 채팅 전송 |

## 13. 신앙 (`/faith`) — `FaithController`

| Method | URL | 인증 | 설명 |
|--------|-----|------|------|
| GET | `/faith/questions` | 공개 | 공개 질문 목록 |
| POST | `/faith/questions` | 로그인 | 질문 작성 (`anonymous`, `publicVisible`) |
| GET | `/faith/questions/my` | 로그인 | 내 질문 |
| POST | `/faith/questions/{id}/answers` | 목회자 | 답변 작성 |
| GET | `/faith/questions/{id}/messages` | 로그인 | 비공개 메시지 (질문자 또는 목회자) |
| POST | `/faith/questions/{id}/messages` | 로그인 | 비공개 메시지 전송 (질문자 또는 목회자) |
| GET | `/faith/prayers` | 공개 | 공개 기도제목 |
| POST | `/faith/prayers` | 로그인 | 기도제목 작성 |
| GET | `/faith/prayers/my` | 로그인 | 내 기도제목 |
| POST | `/faith/prayers/{id}/pray` | 로그인 | "함께 기도" 카운트 +1 |
| GET | `/faith/admin/questions` | 목회자 | 전체 질문 |
| GET | `/faith/admin/prayers` | 목회자 | 전체 기도제목 |
| PUT | `/faith/admin/prayers/{id}/prayed` | 목회자 | "기도함" 표시 토글 |

## 14. 웰컴 키트 — `WelcomeKitController`

| Method | URL | 인증 | 설명 |
|--------|-----|------|------|
| POST | `/welcome/kit` | 로그인 | 신청 (1인 1회, 중복 시 409) |
| GET | `/welcome/kits/my` | 로그인 | 내 신청 내역 |

## 15. 업로드 (`/upload`) — `UploadController`

| Method | URL | 인증 | 설명 |
|--------|-----|------|------|
| POST | `/upload` | 로그인 | `file` 필드. jpg/png/gif/webp(바이트로 판별)만, 최대 5MB. `data.url`에 Supabase Storage 공개 URL |

---

## 16. 관리자 API

### `AdminController` (`/admin`, 경로 규칙으로 관리자 전용)
| Method | URL | 인증 | 설명 |
|--------|-----|------|------|
| GET | `/admin/dashboard` | 관리자 | 전체/오늘 가입자·게시글 수 |
| GET | `/admin/pending-counts` | 관리자 · 교회 범위 | 사이드바 배지 (대여·웰컴 키트·신앙 질문·신고 대기 수) |
| GET | `/admin/users?search=&role=&churchId=&page=` | 관리자 | 회원 목록 (탈퇴 제외) |
| PUT | `/admin/users/{userId}/status` | 관리자 | 상태 변경 (ACTIVE 외로 바꾸면 refresh 토큰 삭제) |
| PUT | `/admin/users/{userId}/role` | 최고관리자 | 역할 변경 (`role`, 관리자 역할이면 `churchId` 필수) |
| DELETE | `/admin/users/{userId}` | 최고관리자 | 회원 삭제 (익명화) |
| PUT | `/admin/posts/{postId}/status` | 관리자 | 게시글 상태 변경 |
| GET | `/admin/categories` | 관리자 | 전체 카테고리 (비공개 포함) |
| POST | `/admin/categories` | 관리자 | 카테고리 생성 |
| PUT | `/admin/categories/{id}` | 관리자 | 카테고리 수정 |
| DELETE | `/admin/categories/{id}` | 관리자 | 카테고리 삭제 |
| GET | `/admin/events` | 관리자 · 교회 범위 | 행사 목록 (DRAFT 포함, 기본 50개) |
| POST | `/admin/events` | 관리자 · 교회 범위 | 행사 생성 (201) |
| PUT | `/admin/events/{eventId}` | 관리자 · 교회 범위 | 행사 수정 |
| PATCH | `/admin/events/{eventId}/status` | 관리자 · 교회 범위 | 상태만 변경 |
| DELETE | `/admin/events/{eventId}` | 관리자 · 교회 범위 | 삭제 (상태를 CANCELLED로) |
| GET | `/admin/participants` | 관리자 | 전체 행사 참여자 |
| GET | `/admin/events/{eventId}/participants` | 관리자 | 행사별 참여자 |
| GET | `/admin/reports?status=` | 관리자 | 신고 목록 |
| PUT | `/admin/reports/{reportId}/resolve` | 관리자 | 신고 해결 |
| PUT | `/admin/reports/{reportId}/reject` | 관리자 | 신고 기각 |

### 교회 / 공간 / 물품 / 웰컴 키트 관리
| Method | URL | 인증 | 설명 |
|--------|-----|------|------|
| GET | `/admin/churches` | 관리자 | 전체 교회 (비공개 포함) |
| POST | `/admin/churches` | 최고관리자 | 교회 생성 |
| PUT | `/admin/churches/{id}` | 관리자 | 교회 수정 (최고관리자 외에는 자기 소속 교회만) |
| DELETE | `/admin/churches/{id}` | 최고관리자 | 교회 삭제 |
| GET | `/admin/spaces` | 관리자 · 교회 범위 | 공간 목록 |
| POST | `/admin/spaces` | 관리자 · 교회 범위 | 공간 생성 |
| PUT | `/admin/spaces/{id}` | 관리자 · 교회 범위 | 공간 수정 |
| DELETE | `/admin/spaces/{id}` | 관리자 · 교회 범위 | 공간 삭제 (신청이 있으면 불가) |
| GET | `/admin/spaces/{id}/blocks` | 관리자 | 차단 시간 목록 |
| POST | `/admin/spaces/{id}/blocks` | 관리자 · 교회 범위 | 차단 시간 추가 (반복 요일 / 특정 날짜) |
| DELETE | `/admin/spaces/blocks/{blockId}` | 관리자 · 교회 범위 | 차단 시간 삭제 |
| GET | `/admin/spaces/rentals` | 관리자 · 교회 범위 | 대여 신청 목록 |
| PUT | `/admin/spaces/rentals/{rentalId}/approve` | 관리자 · 교회 범위 | 승인 (신청자에게 알림) |
| PUT | `/admin/spaces/rentals/{rentalId}/reject` | 관리자 · 교회 범위 | 거절 (`reason`, 알림) |
| PUT | `/admin/spaces/rentals/{rentalId}/message` | 관리자 · 교회 범위 | 관리자 메시지 |
| GET | `/admin/items` | 관리자 · 교회 범위 | 물품 목록 |
| POST | `/admin/items` | 관리자 · 교회 범위 | 물품 생성 |
| PUT | `/admin/items/{id}` | 관리자 · 교회 범위 | 물품 수정 |
| DELETE | `/admin/items/{id}` | 관리자 · 교회 범위 | 물품 삭제 (신청이 있으면 불가) |
| GET | `/admin/items/rentals` | 관리자 · 교회 범위 | 대여 신청 목록 |
| PUT | `/admin/items/rentals/{rentalId}/approve` | 관리자 · 교회 범위 | 승인 (알림) |
| PUT | `/admin/items/rentals/{rentalId}/reject` | 관리자 · 교회 범위 | 거절 (`reason`, 알림) |
| PUT | `/admin/items/rentals/{rentalId}/return` | 관리자 · 교회 범위 | 반납 처리 (대여 중인 건만) |
| GET | `/admin/welcome/kits` | 관리자 | 웰컴 키트 신청 목록 |
| PUT | `/admin/welcome/kits/{id}/process` | 관리자 | 처리 완료 |
| PUT | `/admin/welcome/kits/{id}/message` | 관리자 | 관리자 메시지 |
| DELETE | `/admin/welcome/kits/{id}` | 관리자 | 삭제 |

신앙 관리 API는 13번(`/faith/admin/...`, 목회자) 참고.

---

## 기타

| Method | URL | 인증 | 설명 |
|--------|-----|------|------|
| GET | `/actuator/health` | 공개 | 헬스 체크 (운영은 상세 숨김) |

## HTTP 상태 코드 정책

| 코드 | 의미 |
|------|------|
| 200 | 성공 |
| 201 | 생성 성공 (회원가입, 게시글·댓글·행사 생성, 행사 참여 신청) |
| 400 | 잘못된 요청 (`INVALID_INPUT`, 재고 부족, 예약 시간 오류 등) |
| 401 | 인증 필요·토큰 무효 (`INVALID_CREDENTIALS`, `INVALID_TOKEN`, `UNAUTHORIZED`, 또는 본문 없는 401) |
| 403 | 권한 없음 (`FORBIDDEN`, `ACCOUNT_SUSPENDED`, `POST_ACCESS_DENIED` 등) |
| 404 | 리소스 없음 (`*_NOT_FOUND`) |
| 405 | 지원하지 않는 메서드 |
| 409 | 충돌 (중복 이메일·닉네임, 이미 예약된 시간, 차단 시간, 행사 정원 초과·중복 신청, 웰컴 키트 중복) |
| 429 | 요청 수 초과 (`RateLimitFilter`) |
| 500 | 서버 에러 |
| 503 | DB 오류 (`DB_ERROR`) |
