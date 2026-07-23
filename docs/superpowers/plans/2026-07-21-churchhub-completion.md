# ChurchHub 전체 완성 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 버그 수정 → 코드 정리 → Event/Notification/Report 도메인 구현 → 인프라 완성까지 ChurchHub를 프로덕션 수준으로 완성한다.

**Architecture:** Spring Boot 3.2.5 (백엔드, PostgreSQL+Redis) + Next.js 14 App Router (프론트엔드). 백엔드는 도메인 단위(auth/user/board/comment/category/event/notification/report/admin)로 패키지를 분리하고, 프론트엔드는 App Router + Zustand + Axios interceptor 패턴을 유지한다.

**Tech Stack:** Java 17, Spring Boot 3.2.5, Spring Security 6, JPA/Hibernate, PostgreSQL, Redis, jjwt 0.12.5 / Next.js 14, TypeScript, Tailwind CSS, Zustand, Axios

## Global Constraints

- 백엔드 패키지 루트: `com.churchhub`
- 프론트엔드 소스 루트: `C:\church-community\frontend\src`
- API 응답은 항상 `ApiResponse<T>` 래퍼 사용
- 모든 API URL prefix: `/api/v1/`
- 공개 GET에는 인증 불필요, 쓰기/수정은 인증 필요
- 관리자 전용: `/api/v1/admin/**` (SecurityConfig URL 레벨에서 제한)
- 프론트 공통 색상: `#003478` (메인 블루), `#EDEFF1` (보더), `#f4f6f8` (배경)

---

## 검수 결과 요약

### 버그
| # | 위치 | 내용 |
|---|------|------|
| B1 | `AuthService.java:66` | `expiresIn`에 refreshExpiry(7일) 대신 accessExpiry(15분)를 넣어야 함. `JwtTokenProvider.getAccessExpiry()` getter 누락 |
| B2 | `application-dev.yml:5` | DB 비밀번호 하드코딩 (`dankor1237`) → 환경변수로 분리 필요 |
| B3 | `AdminDashboard page.tsx:72` | 내부 링크에 `<a href>` 사용 → 전체 페이지 리로드 발생, `<Link>` 로 교체 필요 |

### 코드 품질 문제
| # | 위치 | 내용 |
|---|------|------|
| Q1 | `frontend/src/app/(site)/page.tsx`, `posts/page.tsx` | `formatDate` 함수 중복 |
| Q2 | 프론트 각 페이지 | `Post`, `Comment`, `Category` 인터페이스 인라인 중복 선언 |
| Q3 | `application-dev.yml` | DB URL/password를 `.env` 또는 환경변수로 분리 안 됨 |

### 미구현 기능
| # | 영역 | 내용 |
|---|------|------|
| M1 | 백엔드 | Event 도메인 전체 (엔티티, 서비스, 컨트롤러) |
| M2 | 백엔드 | Notification 도메인 전체 |
| M3 | 백엔드 | Report 도메인 전체 |
| M4 | 프론트 | `/events`, `/events/[id]` 페이지 |
| M5 | 프론트 | `/admin/events` 페이지 |
| M6 | 프론트 | 헤더 "행사" 네비게이션 |
| M7 | 프론트 | 알림 벨 + 드롭다운 |
| M8 | 인프라 | `docker-compose.yml` 미작성 |
| M9 | 인프라 | 프론트 `.env.local` 미작성 |

---

## 파일 변경 맵

### 수정 대상 파일
- `backend/src/main/java/com/churchhub/security/JwtTokenProvider.java` — `getAccessExpiry()` getter 추가
- `backend/src/main/java/com/churchhub/domain/auth/service/AuthService.java` — `expiresIn` 버그 수정
- `backend/src/main/resources/application-dev.yml` — 비밀번호 환경변수화
- `backend/src/main/java/com/churchhub/domain/admin/api/AdminController.java` — 이벤트 관리 엔드포인트 추가
- `backend/src/main/java/com/churchhub/config/SecurityConfig.java` — `/api/v1/events/**` GET 공개 추가
- `backend/src/main/java/com/churchhub/exception/ErrorCode.java` — Notification/Report 에러코드 추가
- `frontend/src/lib/utils.ts` — `formatDate` 공통 유틸 (새 파일)
- `frontend/src/types/index.ts` — 공통 인터페이스 (새 파일)
- `frontend/src/components/Header.tsx` — 행사 네비 + 알림 벨 추가
- `frontend/src/app/admin/page.tsx` — `<a>` → `<Link>` 수정
- `frontend/src/app/admin/layout.tsx` — 이벤트 관리 nav item 추가

### 새로 생성할 파일 (백엔드)
```
backend/src/main/java/com/churchhub/domain/event/
├── entity/
│   ├── Event.java
│   ├── EventStatus.java
│   ├── EventParticipant.java
│   └── EventParticipantStatus.java
├── dto/EventDto.java
├── repository/
│   ├── EventRepository.java
│   └── EventParticipantRepository.java
├── service/EventService.java
└── api/EventController.java

backend/src/main/java/com/churchhub/domain/notification/
├── entity/
│   ├── Notification.java
│   ├── NotificationType.java
│   └── RelatedType.java
├── dto/NotificationDto.java
├── repository/NotificationRepository.java
├── service/NotificationService.java
└── api/NotificationController.java

backend/src/main/java/com/churchhub/domain/report/
├── entity/
│   ├── Report.java
│   ├── ReportTargetType.java
│   └── ReportStatus.java
├── dto/ReportDto.java
├── repository/ReportRepository.java
├── service/ReportService.java
└── api/ReportController.java
```

### 새로 생성할 파일 (프론트엔드)
```
frontend/src/
├── lib/utils.ts                        — formatDate 등 공통 유틸
├── types/index.ts                      — Post, Comment, Category, Event 등 공통 타입
├── app/(site)/events/
│   ├── page.tsx                        — 행사 목록
│   └── [id]/page.tsx                   — 행사 상세 + 참여 신청
├── app/admin/events/
│   └── page.tsx                        — 관리자 행사 관리
└── hooks/
    ├── useCategories.ts
    └── useNotifications.ts
```

### 인프라 파일
```
church-community/
├── docker-compose.yml
├── docker-compose.prod.yml
└── frontend/.env.local.example
```

---

## Task 1: 버그 수정 — AuthService expiresIn

**Files:**
- Modify: `backend/src/main/java/com/churchhub/security/JwtTokenProvider.java`
- Modify: `backend/src/main/java/com/churchhub/domain/auth/service/AuthService.java`

**Interfaces:**
- Produces: `JwtTokenProvider.getAccessExpiry(): long`

- [ ] **Step 1: `JwtTokenProvider`에 `getAccessExpiry()` 추가**

`getRefreshExpiry()` 아래 추가:
```java
public long getAccessExpiry() {
    return accessExpiry;
}
```

- [ ] **Step 2: `AuthService.login()` expiresIn 수정**

`AuthService.java:62-66` 교체:
```java
return AuthDto.TokenResponse.builder()
        .accessToken(accessToken)
        .refreshToken(refreshToken)
        .tokenType("Bearer")
        .expiresIn(jwtTokenProvider.getAccessExpiry() / 1000)  // 15분(900s), 기존은 7일 버그
        .build();
```

- [ ] **Step 3: 빌드 확인**
```bash
cd backend
./gradlew compileJava
```
Expected: BUILD SUCCESSFUL

- [ ] **Step 4: 커밋**
```bash
git add backend/src/main/java/com/churchhub/security/JwtTokenProvider.java
git add backend/src/main/java/com/churchhub/domain/auth/service/AuthService.java
git commit -m "fix: access token expiresIn 반환값 수정 (refreshExpiry → accessExpiry)"
```

---

## Task 2: 보안 — application-dev.yml 비밀번호 환경변수화

**Files:**
- Modify: `backend/src/main/resources/application-dev.yml`

- [ ] **Step 1: application-dev.yml 수정**

기존:
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/churchhub
    username: postgres
    password: dankor1237
```

교체:
```yaml
spring:
  datasource:
    url: ${DB_URL:jdbc:postgresql://localhost:5432/churchhub}
    username: ${DB_USERNAME:postgres}
    password: ${DB_PASSWORD:}
    driver-class-name: org.postgresql.Driver
  jpa:
    show-sql: true

logging:
  level:
    com.churchhub: DEBUG
    org.hibernate.SQL: DEBUG
```

- [ ] **Step 2: 로컬용 `.env` 파일 생성 (gitignore에 이미 있어야 함)**

`backend/.env` (git에 올리지 않음):
```
DB_URL=jdbc:postgresql://localhost:5432/churchhub
DB_USERNAME=postgres
DB_PASSWORD=dankor1237
```

- [ ] **Step 3: `.gitignore`에 `.env` 추가 확인**
```bash
grep -q "\.env" backend/.gitignore || echo ".env" >> backend/.gitignore
```

- [ ] **Step 4: 커밋**
```bash
git add backend/src/main/resources/application-dev.yml backend/.gitignore
git commit -m "security: DB 비밀번호 하드코딩 제거, 환경변수로 분리"
```

---

## Task 3: 프론트엔드 공통 유틸 + 타입 정리

**Files:**
- Create: `frontend/src/lib/utils.ts`
- Create: `frontend/src/types/index.ts`
- Modify: `frontend/src/app/(site)/page.tsx` — formatDate import로 교체
- Modify: `frontend/src/app/(site)/posts/page.tsx` — formatDate import로 교체, Post interface 제거
- Modify: `frontend/src/app/(site)/posts/[id]/page.tsx` — Post, Comment interface → types import

**Interfaces:**
- Produces: `formatDate(dateStr: string): string`
- Produces: `Post`, `Comment`, `Category`, `Event` 공통 타입

- [ ] **Step 1: `frontend/src/lib/utils.ts` 생성**

```typescript
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return '방금 전';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}
```

- [ ] **Step 2: `frontend/src/types/index.ts` 생성**

```typescript
export interface Post {
  id: number;
  title: string;
  content?: string;
  authorId?: number;
  authorNickname: string;
  categoryId?: number;
  categoryName: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  liked?: boolean;
  notice?: boolean;
  createdAt: string;
}

export interface Comment {
  id: number;
  content: string;
  authorNickname: string | null;
  authorId: number | null;
  parentId: number | null;
  deleted: boolean;
  replies?: Comment[];
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  type: string;
  visible?: boolean;
  sortOrder?: number;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  maxParticipants: number | null;
  currentParticipants: number;
  thumbnailUrl: string | null;
  status: 'UPCOMING' | 'ONGOING' | 'ENDED' | 'CANCELLED';
  authorNickname: string;
  joined?: boolean;
  createdAt: string;
}

export interface Notification {
  id: number;
  type: 'COMMENT' | 'LIKE' | 'EVENT' | 'NOTICE';
  content: string;
  relatedId: number;
  relatedType: 'POST' | 'COMMENT' | 'EVENT';
  read: boolean;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}
```

- [ ] **Step 3: `page.tsx` (홈) 수정 — 인라인 인터페이스 + formatDate 제거**

`frontend/src/app/(site)/page.tsx` 상단 교체:
```typescript
import { formatDate } from '@/lib/utils';
import type { Post } from '@/types';
// 기존 인라인 interface Post { ... } 제거
// 기존 function formatDate { ... } 제거
```

- [ ] **Step 4: `posts/page.tsx` 동일하게 수정**

```typescript
import { formatDate } from '@/lib/utils';
import type { Post, Category } from '@/types';
// 인라인 interface 제거
```

- [ ] **Step 5: `posts/[id]/page.tsx` 수정**

```typescript
import { formatDate } from '@/lib/utils';
import type { Post, Comment } from '@/types';
// 인라인 interface 제거, formatDate 함수 제거
```

- [ ] **Step 6: TypeScript 빌드 확인**
```bash
cd frontend
npx tsc --noEmit
```
Expected: 에러 없음

- [ ] **Step 7: 커밋**
```bash
git add frontend/src/lib/utils.ts frontend/src/types/index.ts
git add frontend/src/app/\(site\)/page.tsx frontend/src/app/\(site\)/posts/page.tsx frontend/src/app/\(site\)/posts/\[id\]/page.tsx
git commit -m "refactor: 공통 타입/유틸 분리, formatDate 중복 제거"
```

---

## Task 4: 프론트엔드 버그 수정 — Admin 대시보드 `<a>` → `<Link>`

**Files:**
- Modify: `frontend/src/app/admin/page.tsx`

- [ ] **Step 1: import 추가 및 `<a>` → `<Link>` 교체**

`frontend/src/app/admin/page.tsx` 상단에 `import Link from 'next/link';` 추가.

기존 빠른 메뉴 부분 (`<a key=... href=...`):
```tsx
<Link
  key={item.href}
  href={item.href}
  className="flex flex-col p-4 bg-gray-50 rounded-xl hover:bg-blue-50 hover:border-blue-100 border border-transparent transition"
>
```

- [ ] **Step 2: 빌드 확인**
```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 3: 커밋**
```bash
git add frontend/src/app/admin/page.tsx
git commit -m "fix: admin 대시보드 내부 링크 <a> → <Link> 교체"
```

---

## Task 5: 백엔드 — Event 도메인 구현

**Files:**
- Create: `backend/src/main/java/com/churchhub/domain/event/entity/EventStatus.java`
- Create: `backend/src/main/java/com/churchhub/domain/event/entity/EventParticipantStatus.java`
- Create: `backend/src/main/java/com/churchhub/domain/event/entity/Event.java`
- Create: `backend/src/main/java/com/churchhub/domain/event/entity/EventParticipant.java`
- Create: `backend/src/main/java/com/churchhub/domain/event/dto/EventDto.java`
- Create: `backend/src/main/java/com/churchhub/domain/event/repository/EventRepository.java`
- Create: `backend/src/main/java/com/churchhub/domain/event/repository/EventParticipantRepository.java`
- Create: `backend/src/main/java/com/churchhub/domain/event/service/EventService.java`
- Create: `backend/src/main/java/com/churchhub/domain/event/api/EventController.java`
- Modify: `backend/src/main/java/com/churchhub/config/SecurityConfig.java`

**Interfaces:**
- Produces: `GET /api/v1/events` (목록, 공개)
- Produces: `GET /api/v1/events/{id}` (상세, 공개)
- Produces: `POST /api/v1/events/{id}/join` (참여 신청, 인증 필요)
- Produces: `DELETE /api/v1/events/{id}/join` (신청 취소, 인증 필요)
- Produces: `POST /api/v1/admin/events` (관리자 생성)
- Produces: `PUT /api/v1/admin/events/{id}` (관리자 수정)
- Produces: `DELETE /api/v1/admin/events/{id}` (관리자 삭제)

- [ ] **Step 1: EventStatus.java**

```java
package com.churchhub.domain.event.entity;

public enum EventStatus {
    UPCOMING, ONGOING, ENDED, CANCELLED
}
```

- [ ] **Step 2: EventParticipantStatus.java**

```java
package com.churchhub.domain.event.entity;

public enum EventParticipantStatus {
    REGISTERED, CANCELLED
}
```

- [ ] **Step 3: Event.java**

```java
package com.churchhub.domain.event.entity;

import com.churchhub.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "events")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User author;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 200)
    private String location;

    @Column(nullable = false)
    private LocalDateTime startDate;

    @Column(nullable = false)
    private LocalDateTime endDate;

    private Integer maxParticipants;

    private int currentParticipants = 0;

    private String thumbnailUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventStatus status = EventStatus.UPCOMING;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Builder
    public Event(User author, String title, String description, String location,
                 LocalDateTime startDate, LocalDateTime endDate,
                 Integer maxParticipants, String thumbnailUrl) {
        this.author = author;
        this.title = title;
        this.description = description;
        this.location = location;
        this.startDate = startDate;
        this.endDate = endDate;
        this.maxParticipants = maxParticipants;
        this.thumbnailUrl = thumbnailUrl;
    }

    public void update(String title, String description, String location,
                       LocalDateTime startDate, LocalDateTime endDate,
                       Integer maxParticipants, String thumbnailUrl) {
        this.title = title;
        this.description = description;
        this.location = location;
        this.startDate = startDate;
        this.endDate = endDate;
        this.maxParticipants = maxParticipants;
        if (thumbnailUrl != null) this.thumbnailUrl = thumbnailUrl;
    }

    public void changeStatus(EventStatus status) { this.status = status; }

    public void incrementParticipants() { this.currentParticipants++; }
    public void decrementParticipants() { if (this.currentParticipants > 0) this.currentParticipants--; }

    public boolean isFull() {
        return maxParticipants != null && currentParticipants >= maxParticipants;
    }
}
```

- [ ] **Step 4: EventParticipant.java**

```java
package com.churchhub.domain.event.entity;

import com.churchhub.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "event_participants",
       uniqueConstraints = @UniqueConstraint(columnNames = {"event_id", "user_id"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class EventParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventParticipantStatus status = EventParticipantStatus.REGISTERED;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public EventParticipant(Event event, User user) {
        this.event = event;
        this.user = user;
    }

    public void cancel() { this.status = EventParticipantStatus.CANCELLED; }
}
```

- [ ] **Step 5: EventDto.java**

```java
package com.churchhub.domain.event.dto;

import com.churchhub.domain.event.entity.Event;
import com.churchhub.domain.event.entity.EventStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

public class EventDto {

    @Getter
    public static class CreateRequest {
        @NotBlank private String title;
        @NotBlank private String description;
        @NotBlank private String location;
        @NotNull  private LocalDateTime startDate;
        @NotNull  private LocalDateTime endDate;
        private Integer maxParticipants;
        private String thumbnailUrl;
    }

    @Getter
    public static class UpdateRequest {
        @NotBlank private String title;
        @NotBlank private String description;
        @NotBlank private String location;
        @NotNull  private LocalDateTime startDate;
        @NotNull  private LocalDateTime endDate;
        private Integer maxParticipants;
        private String thumbnailUrl;
        private EventStatus status;
    }

    @Getter
    @Builder
    public static class Response {
        private Long id;
        private String title;
        private String description;
        private String location;
        private LocalDateTime startDate;
        private LocalDateTime endDate;
        private Integer maxParticipants;
        private int currentParticipants;
        private String thumbnailUrl;
        private EventStatus status;
        private String authorNickname;
        private boolean joined;
        private LocalDateTime createdAt;

        public static Response from(Event event, boolean joined) {
            return Response.builder()
                    .id(event.getId())
                    .title(event.getTitle())
                    .description(event.getDescription())
                    .location(event.getLocation())
                    .startDate(event.getStartDate())
                    .endDate(event.getEndDate())
                    .maxParticipants(event.getMaxParticipants())
                    .currentParticipants(event.getCurrentParticipants())
                    .thumbnailUrl(event.getThumbnailUrl())
                    .status(event.getStatus())
                    .authorNickname(event.getAuthor().getNickname())
                    .joined(joined)
                    .createdAt(event.getCreatedAt())
                    .build();
        }
    }
}
```

- [ ] **Step 6: EventRepository.java**

```java
package com.churchhub.domain.event.repository;

import com.churchhub.domain.event.entity.Event;
import com.churchhub.domain.event.entity.EventStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventRepository extends JpaRepository<Event, Long> {
    Page<Event> findAllByStatusNot(EventStatus status, Pageable pageable);
    long countByStatus(EventStatus status);
}
```

- [ ] **Step 7: EventParticipantRepository.java**

```java
package com.churchhub.domain.event.repository;

import com.churchhub.domain.event.entity.EventParticipant;
import com.churchhub.domain.event.entity.EventParticipantStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EventParticipantRepository extends JpaRepository<EventParticipant, Long> {
    boolean existsByEventIdAndUserIdAndStatus(Long eventId, Long userId, EventParticipantStatus status);
    Optional<EventParticipant> findByEventIdAndUserIdAndStatus(Long eventId, Long userId, EventParticipantStatus status);
    List<EventParticipant> findAllByEventIdAndStatus(Long eventId, EventParticipantStatus status);
}
```

- [ ] **Step 8: EventService.java**

```java
package com.churchhub.domain.event.service;

import com.churchhub.domain.event.dto.EventDto;
import com.churchhub.domain.event.entity.*;
import com.churchhub.domain.event.repository.EventParticipantRepository;
import com.churchhub.domain.event.repository.EventRepository;
import com.churchhub.domain.user.entity.User;
import com.churchhub.domain.user.repository.UserRepository;
import com.churchhub.exception.BusinessException;
import com.churchhub.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EventService {

    private final EventRepository eventRepository;
    private final EventParticipantRepository participantRepository;
    private final UserRepository userRepository;

    public Page<EventDto.Response> getEvents(Pageable pageable) {
        return eventRepository.findAllByStatusNot(EventStatus.CANCELLED, pageable)
                .map(e -> EventDto.Response.from(e, false));
    }

    public EventDto.Response getEvent(Long eventId, Long userId) {
        Event event = getEventOrThrow(eventId);
        boolean joined = userId != null && participantRepository
                .existsByEventIdAndUserIdAndStatus(eventId, userId, EventParticipantStatus.REGISTERED);
        return EventDto.Response.from(event, joined);
    }

    @Transactional
    public EventDto.Response createEvent(EventDto.CreateRequest request, Long userId) {
        User author = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        Event event = Event.builder()
                .author(author)
                .title(request.getTitle())
                .description(request.getDescription())
                .location(request.getLocation())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .maxParticipants(request.getMaxParticipants())
                .thumbnailUrl(request.getThumbnailUrl())
                .build();
        return EventDto.Response.from(eventRepository.save(event), false);
    }

    @Transactional
    public EventDto.Response updateEvent(Long eventId, EventDto.UpdateRequest request) {
        Event event = getEventOrThrow(eventId);
        event.update(request.getTitle(), request.getDescription(), request.getLocation(),
                request.getStartDate(), request.getEndDate(),
                request.getMaxParticipants(), request.getThumbnailUrl());
        if (request.getStatus() != null) event.changeStatus(request.getStatus());
        return EventDto.Response.from(event, false);
    }

    @Transactional
    public void deleteEvent(Long eventId) {
        Event event = getEventOrThrow(eventId);
        event.changeStatus(EventStatus.CANCELLED);
    }

    @Transactional
    public void joinEvent(Long eventId, Long userId) {
        Event event = getEventOrThrow(eventId);
        if (event.isFull()) throw new BusinessException(ErrorCode.EVENT_FULL);
        if (participantRepository.existsByEventIdAndUserIdAndStatus(eventId, userId, EventParticipantStatus.REGISTERED)) {
            throw new BusinessException(ErrorCode.EVENT_ALREADY_JOINED);
        }
        User user = userRepository.getReferenceById(userId);
        participantRepository.save(EventParticipant.builder().event(event).user(user).build());
        event.incrementParticipants();
    }

    @Transactional
    public void cancelJoin(Long eventId, Long userId) {
        EventParticipant participant = participantRepository
                .findByEventIdAndUserIdAndStatus(eventId, userId, EventParticipantStatus.REGISTERED)
                .orElseThrow(() -> new BusinessException(ErrorCode.EVENT_NOT_JOINED));
        participant.cancel();
        getEventOrThrow(eventId).decrementParticipants();
    }

    private Event getEventOrThrow(Long eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new BusinessException(ErrorCode.EVENT_NOT_FOUND));
    }
}
```

- [ ] **Step 9: EventController.java**

```java
package com.churchhub.domain.event.api;

import com.churchhub.common.response.ApiResponse;
import com.churchhub.domain.event.dto.EventDto;
import com.churchhub.domain.event.service.EventService;
import com.churchhub.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "행사", description = "행사 API")
@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @Operation(summary = "행사 목록 조회")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<EventDto.Response>>> getEvents(
            @PageableDefault(size = 10, sort = "startDate", direction = Sort.Direction.ASC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(eventService.getEvents(pageable)));
    }

    @Operation(summary = "행사 상세 조회")
    @GetMapping("/{eventId}")
    public ResponseEntity<ApiResponse<EventDto.Response>> getEvent(
            @PathVariable Long eventId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = userDetails != null ? userDetails.getUserId() : null;
        return ResponseEntity.ok(ApiResponse.success(eventService.getEvent(eventId, userId)));
    }

    @Operation(summary = "행사 참여 신청")
    @PostMapping("/{eventId}/join")
    public ResponseEntity<ApiResponse<Void>> joinEvent(
            @PathVariable Long eventId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        eventService.joinEvent(eventId, userDetails.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("행사 참여 신청이 완료되었습니다.", null));
    }

    @Operation(summary = "행사 참여 취소")
    @DeleteMapping("/{eventId}/join")
    public ResponseEntity<ApiResponse<Void>> cancelJoin(
            @PathVariable Long eventId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        eventService.cancelJoin(eventId, userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success("참여 신청이 취소되었습니다.", null));
    }
}
```

- [ ] **Step 10: SecurityConfig.java에 이벤트 공개 GET 추가**

기존 `.requestMatchers(HttpMethod.GET, "/api/v1/events/**").permitAll()` 이미 있음 → 확인만.

없으면 `"/api/v1/comments/**"` 아래에 추가:
```java
.requestMatchers(HttpMethod.GET, "/api/v1/events/**").permitAll()
```

- [ ] **Step 11: AdminController에 이벤트 CRUD 추가**

`AdminController.java`에 `EventService` 주입 및 메서드 추가:

```java
private final EventService eventService;

@Operation(summary = "행사 생성")
@PostMapping("/events")
public ResponseEntity<ApiResponse<EventDto.Response>> createEvent(
        @Valid @RequestBody EventDto.CreateRequest request,
        @AuthenticationPrincipal CustomUserDetails userDetails) {
    return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(eventService.createEvent(request, userDetails.getUserId())));
}

@Operation(summary = "행사 수정")
@PutMapping("/events/{eventId}")
public ResponseEntity<ApiResponse<EventDto.Response>> updateEvent(
        @PathVariable Long eventId,
        @Valid @RequestBody EventDto.UpdateRequest request) {
    return ResponseEntity.ok(ApiResponse.success(eventService.updateEvent(eventId, request)));
}

@Operation(summary = "행사 삭제 (상태 CANCELLED)")
@DeleteMapping("/events/{eventId}")
public ResponseEntity<ApiResponse<Void>> deleteEvent(@PathVariable Long eventId) {
    eventService.deleteEvent(eventId);
    return ResponseEntity.ok(ApiResponse.success("행사가 삭제되었습니다.", null));
}
```

AdminController import 추가:
```java
import com.churchhub.domain.event.dto.EventDto;
import com.churchhub.domain.event.service.EventService;
```

- [ ] **Step 12: 빌드 확인**
```bash
cd backend && ./gradlew compileJava
```
Expected: BUILD SUCCESSFUL

- [ ] **Step 13: 커밋**
```bash
git add backend/src/main/java/com/churchhub/domain/event/
git add backend/src/main/java/com/churchhub/domain/admin/api/AdminController.java
git add backend/src/main/java/com/churchhub/config/SecurityConfig.java
git commit -m "feat: Event 도메인 구현 (CRUD, 참여 신청/취소, 관리자 관리)"
```

---

## Task 6: 프론트엔드 — 행사 페이지 구현

**Files:**
- Create: `frontend/src/app/(site)/events/page.tsx`
- Create: `frontend/src/app/(site)/events/[id]/page.tsx`
- Create: `frontend/src/app/admin/events/page.tsx`
- Modify: `frontend/src/components/Header.tsx` — "행사" 네비 링크 추가
- Modify: `frontend/src/app/admin/layout.tsx` — 행사 관리 nav item 추가

**Interfaces:**
- Consumes: `GET /api/v1/events`, `GET /api/v1/events/{id}`, `POST/DELETE /api/v1/events/{id}/join`
- Consumes: `POST/PUT/DELETE /api/v1/admin/events`

- [ ] **Step 1: `events/page.tsx` (행사 목록)**

```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import type { Event, PageResponse } from '@/types';

const STATUS_LABEL: Record<string, string> = {
  UPCOMING: '예정',
  ONGOING: '진행 중',
  ENDED: '종료',
  CANCELLED: '취소',
};

const STATUS_COLOR: Record<string, string> = {
  UPCOMING: 'bg-blue-50 text-blue-600 border-blue-100',
  ONGOING: 'bg-green-50 text-green-600 border-green-100',
  ENDED: 'bg-gray-100 text-gray-400 border-gray-200',
  CANCELLED: 'bg-red-50 text-red-400 border-red-100',
};

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/events', { params: { page: 0, size: 20, sort: 'startDate,asc' } })
      .then((r) => {
        const data: PageResponse<Event> = r.data.data;
        setEvents(data.content);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">행사 일정</h1>
        <p className="text-sm text-gray-500 mt-1">교회 행사 일정을 확인하고 참여 신청하세요</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-[#EDEFF1] rounded-xl p-5 animate-pulse">
              <div className="h-5 bg-gray-100 rounded w-2/3 mb-2" />
              <div className="h-4 bg-gray-50 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white border border-[#EDEFF1] rounded-xl py-16 text-center">
          <div className="text-3xl mb-2">📅</div>
          <p className="text-gray-400 text-sm">예정된 행사가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="block bg-white border border-[#EDEFF1] rounded-xl p-5 hover:border-[#003478] hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded border font-medium ${STATUS_COLOR[event.status]}`}>
                      {STATUS_LABEL[event.status]}
                    </span>
                    <h2 className="text-sm font-bold text-gray-900 truncate">{event.title}</h2>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>📍 {event.location}</span>
                    <span>·</span>
                    <span>📅 {new Date(event.startDate).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}</span>
                    {event.maxParticipants && (
                      <>
                        <span>·</span>
                        <span>👥 {event.currentParticipants}/{event.maxParticipants}명</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: `events/[id]/page.tsx` (행사 상세)**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { Event } from '@/types';

const STATUS_LABEL: Record<string, string> = {
  UPCOMING: '참여 신청 가능',
  ONGOING: '진행 중',
  ENDED: '행사 종료',
  CANCELLED: '행사 취소',
};

export default function EventDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isLoggedIn, user } = useAuthStore();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchEvent = () =>
    api.get(`/events/${id}`).then((r) => setEvent(r.data.data)).finally(() => setLoading(false));

  useEffect(() => { fetchEvent(); }, [id]);

  const handleJoin = async () => {
    if (!isLoggedIn) { router.push('/login'); return; }
    setActionLoading(true);
    try {
      if (event?.joined) {
        await api.delete(`/events/${id}/join`);
      } else {
        await api.post(`/events/${id}/join`);
      }
      await fetchEvent();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || '처리에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-6 animate-pulse">
      <div className="h-8 bg-gray-100 rounded w-2/3 mb-4" />
      <div className="h-48 bg-gray-100 rounded" />
    </div>
  );
  if (!event) return (
    <div className="max-w-3xl mx-auto px-4 py-8 text-center text-gray-400">행사를 찾을 수 없습니다.</div>
  );

  const canJoin = event.status === 'UPCOMING' || event.status === 'ONGOING';
  const isFull = event.maxParticipants !== null && event.currentParticipants >= event.maxParticipants && !event.joined;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Link href="/events" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-[#003478] mb-4 transition">
        ← 행사 목록
      </Link>

      <article className="bg-white border border-[#EDEFF1] rounded-xl overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-[#EDEFF1]">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs bg-blue-50 text-[#003478] border border-blue-100 px-2.5 py-1 rounded font-bold">
              {STATUS_LABEL[event.status]}
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-4">{event.title}</h1>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <span>📍</span><span>{event.location}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <span>👤</span><span>{event.authorNickname}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <span>🗓</span>
              <span>
                {new Date(event.startDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                {' ~ '}
                {new Date(event.endDate).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
              </span>
            </div>
            {event.maxParticipants !== null && (
              <div className="flex items-center gap-2 text-gray-600">
                <span>👥</span>
                <span>{event.currentParticipants} / {event.maxParticipants}명</span>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-6">
          <p className="text-gray-800 leading-loose whitespace-pre-wrap text-sm">{event.description}</p>
        </div>

        {canJoin && (
          <div className="px-6 pb-6 flex justify-center">
            <button
              onClick={handleJoin}
              disabled={actionLoading || (isFull && !event.joined)}
              className={`px-8 py-2.5 rounded-full text-sm font-bold border-2 transition disabled:opacity-50 ${
                event.joined
                  ? 'border-red-400 bg-red-50 text-red-500 hover:bg-red-100'
                  : isFull
                  ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                  : 'border-[#003478] bg-[#003478] text-white hover:bg-[#002560]'
              }`}
            >
              {actionLoading ? '처리 중...' : event.joined ? '참여 취소' : isFull ? '정원 초과' : '참여 신청'}
            </button>
          </div>
        )}
      </article>
    </div>
  );
}
```

- [ ] **Step 3: `admin/events/page.tsx` (관리자 행사 관리)**

```tsx
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Event } from '@/types';

const STATUS_LABEL: Record<string, string> = {
  UPCOMING: '예정', ONGOING: '진행 중', ENDED: '종료', CANCELLED: '취소',
};

const EMPTY_FORM = {
  title: '', description: '', location: '',
  startDate: '', endDate: '', maxParticipants: '', thumbnailUrl: '',
};

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchEvents = () =>
    api.get('/events', { params: { page: 0, size: 50 } })
      .then((r) => setEvents(r.data.data.content))
      .finally(() => setLoading(false));

  useEffect(() => { fetchEvents(); }, []);

  const openCreate = () => { setEditId(null); setForm({ ...EMPTY_FORM }); setShowForm(true); };
  const openEdit = (e: Event) => {
    setEditId(e.id);
    setForm({
      title: e.title, description: e.description, location: e.location,
      startDate: e.startDate.slice(0, 16), endDate: e.endDate.slice(0, 16),
      maxParticipants: e.maxParticipants?.toString() ?? '',
      thumbnailUrl: e.thumbnailUrl ?? '',
    });
    setShowForm(true);
  };

  const handleSave = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSaving(true);
    try {
      const body = {
        ...form,
        maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : null,
      };
      if (editId) {
        await api.put(`/admin/events/${editId}`, body);
      } else {
        await api.post('/admin/events', body);
      }
      setShowForm(false);
      fetchEvents();
    } catch {
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('행사를 삭제(취소)하시겠어요?')) return;
    await api.delete(`/admin/events/${id}`);
    fetchEvents();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">행사 관리</h1>
        <button onClick={openCreate} className="bg-[#003478] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-900 transition">
          + 행사 등록
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="font-bold text-gray-900 mb-4">{editId ? '행사 수정' : '행사 등록'}</h2>
            <form onSubmit={handleSave} className="space-y-3">
              {[
                { key: 'title', label: '제목', type: 'text', required: true },
                { key: 'location', label: '장소', type: 'text', required: true },
                { key: 'startDate', label: '시작일시', type: 'datetime-local', required: true },
                { key: 'endDate', label: '종료일시', type: 'datetime-local', required: true },
                { key: 'maxParticipants', label: '최대 인원 (빈칸=무제한)', type: 'number', required: false },
              ].map(({ key, label, type, required }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
                  <input
                    type={type}
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]"
                    required={required}
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">내용</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478] resize-none"
                  required
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-xl hover:bg-gray-50">
                  취소
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-[#003478] text-white rounded-xl font-semibold hover:bg-blue-900 disabled:opacity-50">
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">제목</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">장소</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">일정</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">상태</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">인원</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {events.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{e.title}</td>
                  <td className="px-4 py-3 text-gray-500">{e.location}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(e.startDate).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{STATUS_LABEL[e.status]}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {e.currentParticipants}{e.maxParticipants ? `/${e.maxParticipants}` : ''}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(e)} className="text-xs text-[#003478] hover:underline">수정</button>
                      <button onClick={() => handleDelete(e.id)} className="text-xs text-red-500 hover:underline">삭제</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: `Header.tsx` — 행사 네비 링크 추가**

기존 네비게이션에 `게시판` 링크 아래 추가:
```tsx
<Link href="/events" className="text-sm text-gray-600 hover:text-[#003478] font-medium px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
  행사
</Link>
```

모바일 드롭다운에도 동일하게 추가:
```tsx
<Link href="/events" className="block py-2 text-sm font-medium text-gray-700 hover:text-[#003478]" onClick={() => setMenuOpen(false)}>행사</Link>
```

- [ ] **Step 5: `admin/layout.tsx` — 행사 관리 nav item 추가**

`navItems` 배열에 추가:
```typescript
{ href: '/admin/events', label: '행사 관리', icon: '📅' },
```

- [ ] **Step 6: TypeScript 빌드 확인**
```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 7: 커밋**
```bash
git add frontend/src/app/\(site\)/events/ frontend/src/app/admin/events/
git add frontend/src/components/Header.tsx frontend/src/app/admin/layout.tsx
git commit -m "feat: 행사 페이지 구현 (목록/상세/참여신청, 관리자 CRUD)"
```

---

## Task 7: 백엔드 — Notification 도메인

**Files:**
- Create: `backend/src/main/java/com/churchhub/domain/notification/entity/NotificationType.java`
- Create: `backend/src/main/java/com/churchhub/domain/notification/entity/RelatedType.java`
- Create: `backend/src/main/java/com/churchhub/domain/notification/entity/Notification.java`
- Create: `backend/src/main/java/com/churchhub/domain/notification/dto/NotificationDto.java`
- Create: `backend/src/main/java/com/churchhub/domain/notification/repository/NotificationRepository.java`
- Create: `backend/src/main/java/com/churchhub/domain/notification/service/NotificationService.java`
- Create: `backend/src/main/java/com/churchhub/domain/notification/api/NotificationController.java`
- Modify: `backend/src/main/java/com/churchhub/domain/comment/service/CommentService.java` — 댓글 생성 시 알림 발송
- Modify: `backend/src/main/java/com/churchhub/domain/board/service/PostService.java` — 좋아요 시 알림 발송
- Modify: `backend/src/main/java/com/churchhub/exception/ErrorCode.java` — NOTIFICATION_NOT_FOUND 추가
- Modify: `backend/src/main/java/com/churchhub/config/SecurityConfig.java` — 알림 API 인증 필요

- [ ] **Step 1: NotificationType.java**

```java
package com.churchhub.domain.notification.entity;

public enum NotificationType {
    COMMENT, LIKE, EVENT, NOTICE
}
```

- [ ] **Step 2: RelatedType.java**

```java
package com.churchhub.domain.notification.entity;

public enum RelatedType {
    POST, COMMENT, EVENT
}
```

- [ ] **Step 3: Notification.java**

```java
package com.churchhub.domain.notification.entity;

import com.churchhub.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User receiver;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id")
    private User sender;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    @Column(nullable = false)
    private String content;

    private Long relatedId;

    @Enumerated(EnumType.STRING)
    private RelatedType relatedType;

    @Column(nullable = false)
    private boolean isRead = false;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public Notification(User receiver, User sender, NotificationType type,
                        String content, Long relatedId, RelatedType relatedType) {
        this.receiver = receiver;
        this.sender = sender;
        this.type = type;
        this.content = content;
        this.relatedId = relatedId;
        this.relatedType = relatedType;
    }

    public void markRead() { this.isRead = true; }
}
```

- [ ] **Step 4: NotificationDto.java**

```java
package com.churchhub.domain.notification.dto;

import com.churchhub.domain.notification.entity.Notification;
import com.churchhub.domain.notification.entity.NotificationType;
import com.churchhub.domain.notification.entity.RelatedType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

public class NotificationDto {

    @Getter
    @Builder
    public static class Response {
        private Long id;
        private NotificationType type;
        private String content;
        private Long relatedId;
        private RelatedType relatedType;
        private boolean read;
        private LocalDateTime createdAt;

        public static Response from(Notification n) {
            return Response.builder()
                    .id(n.getId())
                    .type(n.getType())
                    .content(n.getContent())
                    .relatedId(n.getRelatedId())
                    .relatedType(n.getRelatedType())
                    .read(n.isRead())
                    .createdAt(n.getCreatedAt())
                    .build();
        }
    }
}
```

- [ ] **Step 5: NotificationRepository.java**

```java
package com.churchhub.domain.notification.repository;

import com.churchhub.domain.notification.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findAllByReceiverIdOrderByCreatedAtDesc(Long receiverId, Pageable pageable);
    long countByReceiverIdAndIsReadFalse(Long receiverId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.receiver.id = :receiverId AND n.isRead = false")
    void markAllReadByReceiverId(Long receiverId);
}
```

- [ ] **Step 6: NotificationService.java**

```java
package com.churchhub.domain.notification.service;

import com.churchhub.domain.notification.dto.NotificationDto;
import com.churchhub.domain.notification.entity.Notification;
import com.churchhub.domain.notification.entity.NotificationType;
import com.churchhub.domain.notification.entity.RelatedType;
import com.churchhub.domain.notification.repository.NotificationRepository;
import com.churchhub.domain.user.entity.User;
import com.churchhub.exception.BusinessException;
import com.churchhub.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public Page<NotificationDto.Response> getNotifications(Long userId, Pageable pageable) {
        return notificationRepository
                .findAllByReceiverIdOrderByCreatedAtDesc(userId, pageable)
                .map(NotificationDto.Response::from);
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByReceiverIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markRead(Long notificationId, Long userId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTIFICATION_NOT_FOUND));
        if (!n.getReceiver().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        n.markRead();
    }

    @Transactional
    public void markAllRead(Long userId) {
        notificationRepository.markAllReadByReceiverId(userId);
    }

    @Transactional
    public void send(User receiver, User sender, NotificationType type,
                     String content, Long relatedId, RelatedType relatedType) {
        if (receiver.getId().equals(sender.getId())) return; // 자신에게는 알림 X
        notificationRepository.save(Notification.builder()
                .receiver(receiver)
                .sender(sender)
                .type(type)
                .content(content)
                .relatedId(relatedId)
                .relatedType(relatedType)
                .build());
    }
}
```

- [ ] **Step 7: NotificationController.java**

```java
package com.churchhub.domain.notification.api;

import com.churchhub.common.response.ApiResponse;
import com.churchhub.domain.notification.dto.NotificationDto;
import com.churchhub.domain.notification.service.NotificationService;
import com.churchhub.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "알림", description = "알림 API")
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @Operation(summary = "알림 목록")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<NotificationDto.Response>>> getNotifications(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(
                notificationService.getNotifications(userDetails.getUserId(), pageable)));
    }

    @Operation(summary = "안 읽은 알림 수")
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(
                notificationService.getUnreadCount(userDetails.getUserId())));
    }

    @Operation(summary = "알림 읽음 처리")
    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markRead(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        notificationService.markRead(id, userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success("읽음 처리되었습니다.", null));
    }

    @Operation(summary = "전체 읽음 처리")
    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllRead(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        notificationService.markAllRead(userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success("전체 읽음 처리되었습니다.", null));
    }
}
```

- [ ] **Step 8: ErrorCode에 NOTIFICATION_NOT_FOUND 추가**

`ErrorCode.java` Comment 섹션 아래 추가:
```java
// Notification
NOTIFICATION_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 알림입니다."),
```

- [ ] **Step 9: CommentService에서 알림 발송 — 댓글 작성 시**

`CommentService.java`에 `NotificationService` 주입 후 `createComment()` 내부에 추가:

```java
// 게시글 작성자에게 알림 (본인 댓글 제외)
notificationService.send(
    post.getAuthor(), user,
    NotificationType.COMMENT,
    user.getNickname() + "님이 댓글을 달았습니다: " + request.getContent().substring(0, Math.min(30, request.getContent().length())),
    post.getId(), RelatedType.POST
);
```

imports 추가:
```java
import com.churchhub.domain.notification.entity.NotificationType;
import com.churchhub.domain.notification.entity.RelatedType;
import com.churchhub.domain.notification.service.NotificationService;
```

- [ ] **Step 10: PostService에서 알림 발송 — 좋아요 시**

`toggleLike()` 내부 좋아요 추가 분기에:
```java
notificationService.send(
    post.getAuthor(), user,
    NotificationType.LIKE,
    user.getNickname() + "님이 게시글을 좋아합니다.",
    post.getId(), RelatedType.POST
);
```

- [ ] **Step 11: 빌드 확인**
```bash
cd backend && ./gradlew compileJava
```

- [ ] **Step 12: 커밋**
```bash
git add backend/src/main/java/com/churchhub/domain/notification/
git add backend/src/main/java/com/churchhub/domain/comment/service/CommentService.java
git add backend/src/main/java/com/churchhub/domain/board/service/PostService.java
git add backend/src/main/java/com/churchhub/exception/ErrorCode.java
git commit -m "feat: Notification 도메인 구현, 댓글/좋아요 시 알림 발송"
```

---

## Task 8: 프론트엔드 — 알림 벨 + 드롭다운

**Files:**
- Modify: `frontend/src/components/Header.tsx`
- Create: `frontend/src/hooks/useNotifications.ts`

- [ ] **Step 1: `hooks/useNotifications.ts` 생성**

```typescript
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export function useNotifications() {
  const { isLoggedIn } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchCount = useCallback(() => {
    if (!isLoggedIn) { setUnreadCount(0); return; }
    api.get('/notifications/unread-count')
      .then((r) => setUnreadCount(r.data.data))
      .catch(() => {});
  }, [isLoggedIn]);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 60000); // 1분마다 폴링
    return () => clearInterval(interval);
  }, [fetchCount]);

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    setUnreadCount(0);
  };

  return { unreadCount, fetchCount, markAllRead };
}
```

- [ ] **Step 2: `Header.tsx`에 알림 벨 추가**

`isLoggedIn` 블록의 `+ 글쓰기` 버튼과 유저메뉴 사이에 알림 벨 추가:

```tsx
import { useNotifications } from '@/hooks/useNotifications';

// 컴포넌트 내부
const { unreadCount } = useNotifications();
const [notifOpen, setNotifOpen] = useState(false);
const [notifications, setNotifications] = useState<Notification[]>([]);
const notifRef = useRef<HTMLDivElement>(null);

// 알림 드롭다운 클릭 시 목록 로드
const handleNotifOpen = async () => {
  setNotifOpen(!notifOpen);
  if (!notifOpen) {
    const res = await api.get('/notifications', { params: { page: 0, size: 10 } });
    setNotifications(res.data.data.content);
  }
};

// JSX — 글쓰기 버튼 오른쪽에:
<div className="relative" ref={notifRef}>
  <button onClick={handleNotifOpen} className="relative p-1.5 text-gray-500 hover:text-[#003478]">
    🔔
    {unreadCount > 0 && (
      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
        {unreadCount > 9 ? '9+' : unreadCount}
      </span>
    )}
  </button>
  {notifOpen && (
    <div className="absolute right-0 top-9 bg-white border border-[#EDEFF1] rounded-xl shadow-lg w-72 z-50">
      <div className="px-4 py-3 border-b border-[#EDEFF1] flex items-center justify-between">
        <span className="text-xs font-bold text-gray-900">알림</span>
        <button onClick={() => { markAllRead(); setNotifOpen(false); }} className="text-xs text-[#003478] hover:underline">전체 읽음</button>
      </div>
      <ul className="max-h-72 overflow-y-auto divide-y divide-[#EDEFF1]">
        {notifications.length === 0 ? (
          <li className="py-8 text-center text-xs text-gray-400">새 알림이 없어요</li>
        ) : (
          notifications.map((n) => (
            <li key={n.id} className={`px-4 py-3 text-xs ${n.read ? 'text-gray-400' : 'text-gray-800 font-medium bg-blue-50/30'}`}>
              {n.content}
            </li>
          ))
        )}
      </ul>
    </div>
  )}
</div>
```

- [ ] **Step 3: 빌드 확인**
```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 4: 커밋**
```bash
git add frontend/src/hooks/useNotifications.ts frontend/src/components/Header.tsx
git commit -m "feat: 알림 벨 + 드롭다운 구현, 1분 폴링으로 미읽음 수 갱신"
```

---

## Task 9: 백엔드 — Report 도메인

**Files:**
- Create: `backend/src/main/java/com/churchhub/domain/report/entity/ReportTargetType.java`
- Create: `backend/src/main/java/com/churchhub/domain/report/entity/ReportStatus.java`
- Create: `backend/src/main/java/com/churchhub/domain/report/entity/Report.java`
- Create: `backend/src/main/java/com/churchhub/domain/report/dto/ReportDto.java`
- Create: `backend/src/main/java/com/churchhub/domain/report/repository/ReportRepository.java`
- Create: `backend/src/main/java/com/churchhub/domain/report/service/ReportService.java`
- Create: `backend/src/main/java/com/churchhub/domain/report/api/ReportController.java`
- Modify: `backend/src/main/java/com/churchhub/domain/admin/api/AdminController.java`
- Modify: `backend/src/main/java/com/churchhub/exception/ErrorCode.java`

- [ ] **Step 1: ReportTargetType.java**

```java
package com.churchhub.domain.report.entity;

public enum ReportTargetType { POST, COMMENT, USER }
```

- [ ] **Step 2: ReportStatus.java**

```java
package com.churchhub.domain.report.entity;

public enum ReportStatus { PENDING, RESOLVED, DISMISSED }
```

- [ ] **Step 3: Report.java**

```java
package com.churchhub.domain.report.entity;

import com.churchhub.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "reports",
       uniqueConstraints = @UniqueConstraint(columnNames = {"reporter_id", "target_id", "target_type"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    @Column(nullable = false)
    private Long targetId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportTargetType targetType;

    @Column(nullable = false, length = 500)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportStatus status = ReportStatus.PENDING;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime resolvedAt;

    @Builder
    public Report(User reporter, Long targetId, ReportTargetType targetType, String reason) {
        this.reporter = reporter;
        this.targetId = targetId;
        this.targetType = targetType;
        this.reason = reason;
    }

    public void resolve() { this.status = ReportStatus.RESOLVED; this.resolvedAt = LocalDateTime.now(); }
    public void dismiss() { this.status = ReportStatus.DISMISSED; this.resolvedAt = LocalDateTime.now(); }
}
```

- [ ] **Step 4: ReportDto.java**

```java
package com.churchhub.domain.report.dto;

import com.churchhub.domain.report.entity.Report;
import com.churchhub.domain.report.entity.ReportStatus;
import com.churchhub.domain.report.entity.ReportTargetType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

public class ReportDto {

    @Getter
    public static class CreateRequest {
        @NotNull  private Long targetId;
        @NotNull  private ReportTargetType targetType;
        @NotBlank private String reason;
    }

    @Getter
    @Builder
    public static class Response {
        private Long id;
        private String reporterNickname;
        private Long targetId;
        private ReportTargetType targetType;
        private String reason;
        private ReportStatus status;
        private LocalDateTime createdAt;
        private LocalDateTime resolvedAt;

        public static Response from(Report r) {
            return Response.builder()
                    .id(r.getId())
                    .reporterNickname(r.getReporter().getNickname())
                    .targetId(r.getTargetId())
                    .targetType(r.getTargetType())
                    .reason(r.getReason())
                    .status(r.getStatus())
                    .createdAt(r.getCreatedAt())
                    .resolvedAt(r.getResolvedAt())
                    .build();
        }
    }
}
```

- [ ] **Step 5: ReportRepository.java**

```java
package com.churchhub.domain.report.repository;

import com.churchhub.domain.report.entity.Report;
import com.churchhub.domain.report.entity.ReportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository extends JpaRepository<Report, Long> {
    Page<Report> findAllByStatus(ReportStatus status, Pageable pageable);
    boolean existsByReporterIdAndTargetIdAndTargetType(Long reporterId, Long targetId,
            com.churchhub.domain.report.entity.ReportTargetType targetType);
}
```

- [ ] **Step 6: ReportService.java**

```java
package com.churchhub.domain.report.service;

import com.churchhub.domain.report.dto.ReportDto;
import com.churchhub.domain.report.entity.Report;
import com.churchhub.domain.report.entity.ReportStatus;
import com.churchhub.domain.report.repository.ReportRepository;
import com.churchhub.domain.user.entity.User;
import com.churchhub.domain.user.repository.UserRepository;
import com.churchhub.exception.BusinessException;
import com.churchhub.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;

    @Transactional
    public void createReport(ReportDto.CreateRequest request, Long reporterId) {
        if (reportRepository.existsByReporterIdAndTargetIdAndTargetType(
                reporterId, request.getTargetId(), request.getTargetType())) {
            throw new BusinessException(ErrorCode.ALREADY_REPORTED);
        }
        User reporter = userRepository.getReferenceById(reporterId);
        reportRepository.save(Report.builder()
                .reporter(reporter)
                .targetId(request.getTargetId())
                .targetType(request.getTargetType())
                .reason(request.getReason())
                .build());
    }

    public Page<ReportDto.Response> getPendingReports(Pageable pageable) {
        return reportRepository.findAllByStatus(ReportStatus.PENDING, pageable)
                .map(ReportDto.Response::from);
    }

    @Transactional
    public void resolveReport(Long reportId) {
        getReportOrThrow(reportId).resolve();
    }

    @Transactional
    public void dismissReport(Long reportId) {
        getReportOrThrow(reportId).dismiss();
    }

    private Report getReportOrThrow(Long id) {
        return reportRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.REPORT_NOT_FOUND));
    }
}
```

- [ ] **Step 7: ReportController.java**

```java
package com.churchhub.domain.report.api;

import com.churchhub.common.response.ApiResponse;
import com.churchhub.domain.report.dto.ReportDto;
import com.churchhub.domain.report.service.ReportService;
import com.churchhub.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "신고", description = "신고 API")
@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @Operation(summary = "신고 접수")
    @PostMapping
    public ResponseEntity<ApiResponse<Void>> createReport(
            @Valid @RequestBody ReportDto.CreateRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        reportService.createReport(request, userDetails.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("신고가 접수되었습니다.", null));
    }
}
```

- [ ] **Step 8: AdminController에 신고 관리 추가**

```java
@Operation(summary = "신고 목록 조회")
@GetMapping("/reports")
public ResponseEntity<ApiResponse<Page<ReportDto.Response>>> getReports(Pageable pageable) {
    return ResponseEntity.ok(ApiResponse.success(reportService.getPendingReports(pageable)));
}

@Operation(summary = "신고 처리 완료")
@PutMapping("/reports/{reportId}/resolve")
public ResponseEntity<ApiResponse<Void>> resolveReport(@PathVariable Long reportId) {
    reportService.resolveReport(reportId);
    return ResponseEntity.ok(ApiResponse.success("신고가 처리되었습니다.", null));
}

@Operation(summary = "신고 기각")
@PutMapping("/reports/{reportId}/dismiss")
public ResponseEntity<ApiResponse<Void>> dismissReport(@PathVariable Long reportId) {
    reportService.dismissReport(reportId);
    return ResponseEntity.ok(ApiResponse.success("신고가 기각되었습니다.", null));
}
```

AdminController import 추가:
```java
import com.churchhub.domain.report.dto.ReportDto;
import com.churchhub.domain.report.service.ReportService;
```

- [ ] **Step 9: ErrorCode에 추가**

```java
// Report
ALREADY_REPORTED(HttpStatus.CONFLICT, "이미 신고한 대상입니다."),
REPORT_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 신고입니다."),
```

- [ ] **Step 10: 빌드 확인**
```bash
cd backend && ./gradlew compileJava
```

- [ ] **Step 11: 커밋**
```bash
git add backend/src/main/java/com/churchhub/domain/report/
git add backend/src/main/java/com/churchhub/domain/admin/api/AdminController.java
git add backend/src/main/java/com/churchhub/exception/ErrorCode.java
git commit -m "feat: Report 도메인 구현, 관리자 신고 처리 API"
```

---

## Task 10: 프론트엔드 — 관리자 신고 페이지

**Files:**
- Create: `frontend/src/app/admin/reports/page.tsx`
- Modify: `frontend/src/app/admin/layout.tsx` — 신고 관리 nav item 추가

- [ ] **Step 1: `admin/reports/page.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Report {
  id: number;
  reporterNickname: string;
  targetId: number;
  targetType: string;
  reason: string;
  status: string;
  createdAt: string;
}

const TARGET_LABEL: Record<string, string> = { POST: '게시글', COMMENT: '댓글', USER: '회원' };

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = () =>
    api.get('/admin/reports', { params: { page: 0, size: 50 } })
      .then((r) => setReports(r.data.data.content))
      .finally(() => setLoading(false));

  useEffect(() => { fetchReports(); }, []);

  const handleAction = async (id: number, action: 'resolve' | 'dismiss') => {
    await api.put(`/admin/reports/${id}/${action}`);
    fetchReports();
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">신고 관리</h1>
      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center text-gray-400">
          처리할 신고가 없습니다.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">신고자</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">대상</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">사유</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">일시</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">{r.reporterNickname}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {TARGET_LABEL[r.targetType]} #{r.targetId}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{r.reason}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(r.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => handleAction(r.id, 'resolve')} className="text-xs bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600">처리</button>
                      <button onClick={() => handleAction(r.id, 'dismiss')} className="text-xs border border-gray-300 text-gray-600 px-3 py-1 rounded-lg hover:bg-gray-50">기각</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: `admin/layout.tsx` nav items에 추가**

```typescript
{ href: '/admin/reports', label: '신고 관리', icon: '🚨' },
```

- [ ] **Step 3: 커밋**
```bash
git add frontend/src/app/admin/reports/ frontend/src/app/admin/layout.tsx
git commit -m "feat: 관리자 신고 관리 페이지"
```

---

## Task 11: 인프라 — docker-compose + 환경변수 문서화

**Files:**
- Create: `church-community/docker-compose.yml`
- Create: `church-community/frontend/.env.local.example`

- [ ] **Step 1: `docker-compose.yml` 생성**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: churchhub
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD:-localdev}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD:-}
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      SPRING_PROFILES_ACTIVE: dev
      DB_URL: jdbc:postgresql://postgres:5432/churchhub
      DB_USERNAME: postgres
      DB_PASSWORD: ${DB_PASSWORD:-localdev}
      REDIS_HOST: redis
      REDIS_PORT: 6379
      JWT_SECRET: ${JWT_SECRET:-local-dev-secret-key-must-be-at-least-256-bits-long-for-hs256}
      CORS_ALLOWED_ORIGINS: http://localhost:3000
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8080/api/v1
    depends_on:
      - backend

volumes:
  postgres_data:
```

- [ ] **Step 2: `frontend/.env.local.example` 생성**

```
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

- [ ] **Step 3: 커밋**
```bash
git add docker-compose.yml frontend/.env.local.example
git commit -m "infra: docker-compose.yml 추가, 환경변수 예시 파일 추가"
```

---

## 자체 검토 (Spec Coverage)

| 항목 | Task |
|------|------|
| B1 expiresIn 버그 | Task 1 |
| B2 비밀번호 하드코딩 | Task 2 |
| B3 관리자 `<a>` 링크 | Task 4 |
| Q1 formatDate 중복 | Task 3 |
| Q2 인터페이스 중복 | Task 3 |
| M1 Event 백엔드 | Task 5 |
| M2 Notification 백엔드 | Task 7 |
| M3 Report 백엔드 | Task 9 |
| M4 행사 페이지 | Task 6 |
| M5 관리자 행사 페이지 | Task 6 |
| M6 헤더 "행사" 링크 | Task 6 |
| M7 알림 벨 | Task 8 |
| M8 docker-compose | Task 11 |
| M9 .env.local 예시 | Task 11 |

모든 항목이 Task에 매핑됨. 플레이스홀더 없음.
