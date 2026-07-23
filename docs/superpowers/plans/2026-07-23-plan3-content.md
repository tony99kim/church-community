# Plan 3: Content — 웰컴 키트 + 신앙 Q&A + 게시판 정리 + 행사 확장

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 염리동 웰컴 키트 신청, 신앙 질문/기도 요청 도메인을 추가하고, 기존 게시판 카테고리를 정리하며, Event에 행사 카테고리를 추가한다.

**Architecture:** 기존 Category/Post 시스템을 3개 게시판(공지·자유·소모임모집)으로 정리. Event에 `EventCategory` enum 필드 추가. WelcomeKit, FaithQuestion, PrayerRequest는 신규 도메인으로 추가.

**Tech Stack:** Spring Boot 3.2.5, JPA, Spring Security 6

## Global Constraints

- 패키지 루트: `com.churchhub`
- 빌드: `JAVA_HOME="/c/Users/taeyeop/.jdks/graalvm-jdk-21.0.7" ./gradlew bootRun`
- 응답 wrapper: `ApiResponse.success(data)`
- 엔티티 패턴: `@Builder`, `@Getter`, `@NoArgsConstructor(access = AccessLevel.PROTECTED)`, `@EntityListeners(AuditingEntityListener.class)`
- **Plan 1 완료 후 실행** (UserRole.PASTOR 필요)

---

## Task 1: 게시판 카테고리 정리

**Files:**
- Modify: `backend/src/main/java/com/churchhub/domain/category/entity/CategoryType.java`

**Interfaces:**
- Produces: CategoryType.NOTICE, CategoryType.FREE, CategoryType.GATHERING — 게시판 3종

- [ ] **Step 1: CategoryType enum 정리**

기존 `CategoryType.java`를 아래로 교체:
```java
package com.churchhub.domain.category.entity;

public enum CategoryType {
    NOTICE,     // 공지 (운영진만 작성)
    FREE,       // 자유게시판
    GATHERING,  // 소모임 모집
    EVENT,      // 행사 (기존 유지)
    LOCAL       // 지역 (기존 유지, 추후 활용)
}
```

- [ ] **Step 2: DB에 카테고리 데이터 삽입**

Supabase SQL Editor에서 실행:
```sql
-- 기존 카테고리 정리 (필요 시)
-- INSERT OR IGNORE 방식으로 추가
INSERT INTO categories (name, description, type, visible, sort_order, created_at, updated_at)
VALUES
  ('공지', '운영진 공지사항', 'NOTICE', true, 1, NOW(), NOW()),
  ('자유게시판', '일상·생활 정보·잡담', 'FREE', true, 2, NOW(), NOW()),
  ('소모임 모집', '같이 밥·운동·산책 등 모집', 'GATHERING', true, 3, NOW(), NOW())
ON CONFLICT DO NOTHING;
```

- [ ] **Step 3: 빌드 확인**

```bash
cd backend
JAVA_HOME="/c/Users/taeyeop/.jdks/graalvm-jdk-21.0.7" ./gradlew compileJava
```
Expected: BUILD SUCCESSFUL

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/java/com/churchhub/domain/category/entity/CategoryType.java
git commit -m "feat: 게시판 카테고리 FREE·GATHERING 추가 (공지·자유·소모임모집)"
```

---

## Task 2: Event 행사 카테고리 확장

**Files:**
- Create: `backend/src/main/java/com/churchhub/domain/event/entity/EventCategory.java`
- Modify: `backend/src/main/java/com/churchhub/domain/event/entity/Event.java`
- Modify: `backend/src/main/java/com/churchhub/domain/event/dto/EventDto.java`
- Modify: `backend/src/main/java/com/churchhub/domain/event/service/EventService.java`
- Modify: `backend/src/main/java/com/churchhub/domain/event/repository/EventRepository.java`

**Interfaces:**
- Produces: `EventCategory` enum — 프론트엔드가 카테고리 필터에 사용

- [ ] **Step 1: EventCategory enum 생성**

`EventCategory.java`:
```java
package com.churchhub.domain.event.entity;

public enum EventCategory {
    NEIGHBORHOOD,    // 동네 모임 (밥·운동·산책·독서)
    FAITH,           // 신앙 모임 (찬양·기도·성경)
    SERVICE,         // 섬김 모임 (봉사·복지관·여름성경학교)
    CHURCH,          // 교회별 행사
    WELCOME_TABLE    // 웰컴 테이블
}
```

- [ ] **Step 2: Event 엔티티에 category 필드 추가**

`Event.java`의 필드 영역에 추가:
```java
@Enumerated(EnumType.STRING)
@Column(length = 30)
private EventCategory category = EventCategory.CHURCH;
```

Builder에도 추가:
```java
@Builder
public Event(User author, String title, String description, String location,
             LocalDateTime startDate, LocalDateTime endDate,
             Integer maxParticipants, String thumbnailUrl, EventCategory category) {
    // ... 기존 필드
    this.category = category != null ? category : EventCategory.CHURCH;
}
```

`update()` 메서드에도 추가:
```java
public void update(String title, String description, String location,
                   LocalDateTime startDate, LocalDateTime endDate,
                   Integer maxParticipants, String thumbnailUrl, EventCategory category) {
    // ... 기존 필드
    if (category != null) this.category = category;
}
```

- [ ] **Step 3: EventDto에 category 필드 추가**

`EventDto.java`의 `CreateRequest`, `UpdateRequest`, `Response`에 각각 추가:
```java
// CreateRequest, UpdateRequest에
private EventCategory category;

// Response.from()에
.category(event.getCategory())
```

- [ ] **Step 4: EventRepository에 카테고리 조회 추가**

`EventRepository.java`에 추가:
```java
List<Event> findAllByCategoryOrderByStartDateDesc(EventCategory category);
Page<Event> findAllByCategoryOrderByStartDateDesc(EventCategory category, Pageable pageable);
```

- [ ] **Step 5: EventService에 카테고리 필터 조회 추가**

`EventService.java`에 추가:
```java
public Page<EventDto.Response> getEventsByCategory(EventCategory category, Pageable pageable) {
    return eventRepository.findAllByCategoryOrderByStartDateDesc(category, pageable)
            .map(EventDto.Response::from);
}
```

컨트롤러에 쿼리 파라미터 지원 추가:
`EventController.java`의 `getEvents` 메서드:
```java
@GetMapping("/events")
public ApiResponse<?> getEvents(
        @RequestParam(required = false) EventCategory category,
        Pageable pageable) {
    if (category != null) {
        return ApiResponse.success(eventService.getEventsByCategory(category, pageable));
    }
    return ApiResponse.success(eventService.getEvents(pageable));
}
```

- [ ] **Step 6: DB 마이그레이션 — 기존 이벤트 category 기본값 설정**

Supabase에서 실행:
```sql
ALTER TABLE events ADD COLUMN IF NOT EXISTS category VARCHAR(30) DEFAULT 'CHURCH';
UPDATE events SET category = 'CHURCH' WHERE category IS NULL;
```

- [ ] **Step 7: 빌드 확인**

```bash
cd backend
JAVA_HOME="/c/Users/taeyeop/.jdks/graalvm-jdk-21.0.7" ./gradlew compileJava
```

- [ ] **Step 8: Commit**

```bash
git add backend/src/main/java/com/churchhub/domain/event/
git commit -m "feat: Event에 EventCategory 추가 (동네·신앙·섬김·교회·웰컴테이블)"
```

---

## Task 3: WelcomeKit 도메인 (염리동 웰컴 키트 신청)

**Files:**
- Create: `backend/src/main/java/com/churchhub/domain/welcome/entity/WelcomeKit.java`
- Create: `backend/src/main/java/com/churchhub/domain/welcome/dto/WelcomeKitDto.java`
- Create: `backend/src/main/java/com/churchhub/domain/welcome/repository/WelcomeKitRepository.java`
- Create: `backend/src/main/java/com/churchhub/domain/welcome/service/WelcomeKitService.java`
- Create: `backend/src/main/java/com/churchhub/domain/welcome/api/WelcomeKitController.java`
- Modify: `backend/src/main/java/com/churchhub/exception/ErrorCode.java`

**Interfaces:**
- Produces:
  - `POST /api/v1/welcome/kit` → `WelcomeKitDto.Response` (비로그인 가능)
  - `GET /api/v1/admin/welcome/kits` → 목록 (CHURCH_MANAGER 이상)

- [ ] **Step 1: WelcomeKit 엔티티 생성**

`WelcomeKit.java`:
```java
package com.churchhub.domain.welcome.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "welcome_kits")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class WelcomeKit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(length = 200)
    private String address;

    @Column(length = 300)
    private String message;

    private boolean processed = false;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public WelcomeKit(String name, String phone, String address, String message) {
        this.name = name;
        this.phone = phone;
        this.address = address;
        this.message = message;
    }

    public void markProcessed() { this.processed = true; }
}
```

- [ ] **Step 2: WelcomeKitDto 생성**

`WelcomeKitDto.java`:
```java
package com.churchhub.domain.welcome.dto;

import com.churchhub.domain.welcome.entity.WelcomeKit;
import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

public class WelcomeKitDto {

    @Getter
    public static class Request {
        @NotBlank private String name;
        @NotBlank private String phone;
        private String address;
        private String message;
    }

    @Getter
    @Builder
    public static class Response {
        private Long id;
        private String name;
        private String phone;
        private String address;
        private String message;
        private boolean processed;
        private LocalDateTime createdAt;

        public static Response from(WelcomeKit w) {
            return Response.builder()
                    .id(w.getId()).name(w.getName()).phone(w.getPhone())
                    .address(w.getAddress()).message(w.getMessage())
                    .processed(w.isProcessed()).createdAt(w.getCreatedAt()).build();
        }
    }
}
```

- [ ] **Step 3: WelcomeKitRepository 생성**

`WelcomeKitRepository.java`:
```java
package com.churchhub.domain.welcome.repository;

import com.churchhub.domain.welcome.entity.WelcomeKit;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WelcomeKitRepository extends JpaRepository<WelcomeKit, Long> {
    List<WelcomeKit> findAllByOrderByCreatedAtDesc();
    List<WelcomeKit> findAllByProcessedFalseOrderByCreatedAtDesc();
}
```

- [ ] **Step 4: WelcomeKitService + Controller 생성**

`WelcomeKitService.java`:
```java
package com.churchhub.domain.welcome.service;

import com.churchhub.domain.welcome.dto.WelcomeKitDto;
import com.churchhub.domain.welcome.entity.WelcomeKit;
import com.churchhub.domain.welcome.repository.WelcomeKitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WelcomeKitService {

    private final WelcomeKitRepository welcomeKitRepository;

    @Transactional
    public WelcomeKitDto.Response apply(WelcomeKitDto.Request req) {
        WelcomeKit kit = WelcomeKit.builder()
                .name(req.getName()).phone(req.getPhone())
                .address(req.getAddress()).message(req.getMessage()).build();
        return WelcomeKitDto.Response.from(welcomeKitRepository.save(kit));
    }

    public List<WelcomeKitDto.Response> getAll() {
        return welcomeKitRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(WelcomeKitDto.Response::from).toList();
    }

    @Transactional
    public WelcomeKitDto.Response markProcessed(Long id) {
        WelcomeKit kit = welcomeKitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Not found"));
        kit.markProcessed();
        return WelcomeKitDto.Response.from(kit);
    }
}
```

`WelcomeKitController.java`:
```java
package com.churchhub.domain.welcome.api;

import com.churchhub.common.response.ApiResponse;
import com.churchhub.domain.welcome.dto.WelcomeKitDto;
import com.churchhub.domain.welcome.service.WelcomeKitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class WelcomeKitController {

    private final WelcomeKitService welcomeKitService;

    @PostMapping("/welcome/kit")
    public ApiResponse<WelcomeKitDto.Response> apply(@Valid @RequestBody WelcomeKitDto.Request req) {
        return ApiResponse.success(welcomeKitService.apply(req));
    }

    @GetMapping("/admin/welcome/kits")
    @PreAuthorize("hasAnyRole('CHURCH_MANAGER', 'SUPER_ADMIN')")
    public ApiResponse<List<WelcomeKitDto.Response>> getAll() {
        return ApiResponse.success(welcomeKitService.getAll());
    }

    @PutMapping("/admin/welcome/kits/{id}/process")
    @PreAuthorize("hasAnyRole('CHURCH_MANAGER', 'SUPER_ADMIN')")
    public ApiResponse<WelcomeKitDto.Response> markProcessed(@PathVariable Long id) {
        return ApiResponse.success(welcomeKitService.markProcessed(id));
    }
}
```

- [ ] **Step 5: SecurityConfig에 웰컴 공개 API 추가**

```java
.requestMatchers(HttpMethod.POST, "/api/v1/welcome/kit").permitAll()
```

- [ ] **Step 6: 빌드 확인**

```bash
JAVA_HOME="/c/Users/taeyeop/.jdks/graalvm-jdk-21.0.7" ./gradlew compileJava
```

- [ ] **Step 7: Commit**

```bash
git add backend/src/main/java/com/churchhub/domain/welcome/ \
        backend/src/main/java/com/churchhub/config/SecurityConfig.java
git commit -m "feat: WelcomeKit 도메인 추가 (염리동 웰컴 키트 신청)"
```

---

## Task 4: FaithQuestion 도메인 (신앙 질문)

**Files:**
- Create: `backend/src/main/java/com/churchhub/domain/faith/entity/FaithQuestion.java`
- Create: `backend/src/main/java/com/churchhub/domain/faith/entity/FaithAnswer.java`
- Create: `backend/src/main/java/com/churchhub/domain/faith/dto/FaithDto.java`
- Create: `backend/src/main/java/com/churchhub/domain/faith/repository/FaithQuestionRepository.java`
- Create: `backend/src/main/java/com/churchhub/domain/faith/repository/FaithAnswerRepository.java`
- Create: `backend/src/main/java/com/churchhub/domain/faith/service/FaithService.java`
- Create: `backend/src/main/java/com/churchhub/domain/faith/api/FaithController.java`

**Interfaces:**
- Consumes: `UserRole.PASTOR` (Plan 1)
- Produces:
  - `POST /api/v1/faith/questions` (로그인, 익명 가능)
  - `GET /api/v1/faith/questions` (공개, 비공개 제외)
  - `POST /api/v1/faith/questions/{id}/answers` (PASTOR + SUPER_ADMIN)

- [ ] **Step 1: FaithQuestion 엔티티 생성**

`FaithQuestion.java`:
```java
package com.churchhub.domain.faith.entity;

import com.churchhub.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "faith_questions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class FaithQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User author;

    private boolean anonymous = false;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    private boolean publicVisible = true;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public FaithQuestion(User author, String content, boolean anonymous, boolean publicVisible) {
        this.author = author;
        this.content = content;
        this.anonymous = anonymous;
        this.publicVisible = publicVisible;
    }
}
```

- [ ] **Step 2: FaithAnswer 엔티티 생성**

`FaithAnswer.java`:
```java
package com.churchhub.domain.faith.entity;

import com.churchhub.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "faith_answers")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class FaithAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private FaithQuestion question;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pastor_id", nullable = false)
    private User pastor;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public FaithAnswer(FaithQuestion question, User pastor, String content) {
        this.question = question;
        this.pastor = pastor;
        this.content = content;
    }
}
```

- [ ] **Step 3: FaithDto 생성**

`FaithDto.java`:
```java
package com.churchhub.domain.faith.dto;

import com.churchhub.domain.faith.entity.FaithAnswer;
import com.churchhub.domain.faith.entity.FaithQuestion;
import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

public class FaithDto {

    @Getter
    public static class QuestionRequest {
        @NotBlank private String content;
        private boolean anonymous = false;
        private boolean publicVisible = true;
    }

    @Getter
    public static class AnswerRequest {
        @NotBlank private String content;
    }

    @Getter
    @Builder
    public static class AnswerResponse {
        private Long id;
        private String pastorNickname;
        private String content;
        private LocalDateTime createdAt;

        public static AnswerResponse from(FaithAnswer a) {
            return AnswerResponse.builder()
                    .id(a.getId())
                    .pastorNickname(a.getPastor().getNickname())
                    .content(a.getContent())
                    .createdAt(a.getCreatedAt()).build();
        }
    }

    @Getter
    @Builder
    public static class QuestionResponse {
        private Long id;
        private String authorNickname;  // null if anonymous
        private boolean anonymous;
        private String content;
        private boolean publicVisible;
        private List<AnswerResponse> answers;
        private LocalDateTime createdAt;

        public static QuestionResponse from(FaithQuestion q, List<FaithAnswer> answers) {
            return QuestionResponse.builder()
                    .id(q.getId())
                    .authorNickname(q.isAnonymous() ? null : q.getAuthor().getNickname())
                    .anonymous(q.isAnonymous())
                    .content(q.getContent())
                    .publicVisible(q.isPublicVisible())
                    .answers(answers.stream().map(AnswerResponse::from).toList())
                    .createdAt(q.getCreatedAt()).build();
        }
    }
}
```

- [ ] **Step 4: Repository 생성**

`FaithQuestionRepository.java`:
```java
package com.churchhub.domain.faith.repository;

import com.churchhub.domain.faith.entity.FaithQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FaithQuestionRepository extends JpaRepository<FaithQuestion, Long> {
    List<FaithQuestion> findAllByPublicVisibleTrueOrderByCreatedAtDesc();
}
```

`FaithAnswerRepository.java`:
```java
package com.churchhub.domain.faith.repository;

import com.churchhub.domain.faith.entity.FaithAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FaithAnswerRepository extends JpaRepository<FaithAnswer, Long> {
    List<FaithAnswer> findAllByQuestionIdOrderByCreatedAtAsc(Long questionId);
}
```

- [ ] **Step 5: FaithService + Controller 생성**

`FaithService.java`:
```java
package com.churchhub.domain.faith.service;

import com.churchhub.domain.faith.dto.FaithDto;
import com.churchhub.domain.faith.entity.FaithAnswer;
import com.churchhub.domain.faith.entity.FaithQuestion;
import com.churchhub.domain.faith.repository.FaithAnswerRepository;
import com.churchhub.domain.faith.repository.FaithQuestionRepository;
import com.churchhub.domain.user.entity.User;
import com.churchhub.domain.user.repository.UserRepository;
import com.churchhub.exception.BusinessException;
import com.churchhub.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FaithService {

    private final FaithQuestionRepository questionRepository;
    private final FaithAnswerRepository answerRepository;
    private final UserRepository userRepository;

    public List<FaithDto.QuestionResponse> getPublicQuestions() {
        return questionRepository.findAllByPublicVisibleTrueOrderByCreatedAtDesc()
                .stream().map(q -> FaithDto.QuestionResponse.from(q,
                        answerRepository.findAllByQuestionIdOrderByCreatedAtAsc(q.getId())))
                .toList();
    }

    @Transactional
    public FaithDto.QuestionResponse createQuestion(Long userId, FaithDto.QuestionRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        FaithQuestion q = FaithQuestion.builder()
                .author(user).content(req.getContent())
                .anonymous(req.isAnonymous()).publicVisible(req.isPublicVisible()).build();
        FaithQuestion saved = questionRepository.save(q);
        return FaithDto.QuestionResponse.from(saved, List.of());
    }

    @Transactional
    public FaithDto.AnswerResponse createAnswer(Long questionId, Long pastorId, FaithDto.AnswerRequest req) {
        FaithQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
        User pastor = userRepository.findById(pastorId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        FaithAnswer answer = FaithAnswer.builder()
                .question(question).pastor(pastor).content(req.getContent()).build();
        return FaithDto.AnswerResponse.from(answerRepository.save(answer));
    }
}
```

`FaithController.java`:
```java
package com.churchhub.domain.faith.api;

import com.churchhub.common.response.ApiResponse;
import com.churchhub.domain.faith.dto.FaithDto;
import com.churchhub.domain.faith.service.FaithService;
import com.churchhub.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/faith")
@RequiredArgsConstructor
public class FaithController {

    private final FaithService faithService;

    @GetMapping("/questions")
    public ApiResponse<List<FaithDto.QuestionResponse>> getQuestions() {
        return ApiResponse.success(faithService.getPublicQuestions());
    }

    @PostMapping("/questions")
    public ApiResponse<FaithDto.QuestionResponse> createQuestion(
            @Valid @RequestBody FaithDto.QuestionRequest req,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(faithService.createQuestion(userDetails.getUserId(), req));
    }

    @PostMapping("/questions/{id}/answers")
    @PreAuthorize("hasAnyRole('PASTOR', 'SUPER_ADMIN')")
    public ApiResponse<FaithDto.AnswerResponse> createAnswer(
            @PathVariable Long id,
            @Valid @RequestBody FaithDto.AnswerRequest req,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(faithService.createAnswer(id, userDetails.getUserId(), req));
    }
}
```

- [ ] **Step 6: SecurityConfig에 공개 추가**

```java
.requestMatchers(HttpMethod.GET, "/api/v1/faith/**").permitAll()
```

- [ ] **Step 7: 빌드 확인 + Commit**

```bash
JAVA_HOME="/c/Users/taeyeop/.jdks/graalvm-jdk-21.0.7" ./gradlew compileJava
git add backend/src/main/java/com/churchhub/domain/faith/ \
        backend/src/main/java/com/churchhub/config/SecurityConfig.java
git commit -m "feat: FaithQuestion + FaithAnswer 도메인 추가 (신앙 질문·목사 답변)"
```

---

## Task 5: PrayerRequest 도메인 (기도 요청)

**Files:**
- Create: `backend/src/main/java/com/churchhub/domain/faith/entity/PrayerRequest.java`
- Modify: `backend/src/main/java/com/churchhub/domain/faith/dto/FaithDto.java`
- Create: `backend/src/main/java/com/churchhub/domain/faith/repository/PrayerRequestRepository.java`
- Modify: `backend/src/main/java/com/churchhub/domain/faith/service/FaithService.java`
- Modify: `backend/src/main/java/com/churchhub/domain/faith/api/FaithController.java`

**Interfaces:**
- Produces:
  - `POST /api/v1/faith/prayers` (로그인)
  - `GET /api/v1/faith/prayers` (공개 항목만)

- [ ] **Step 1: PrayerRequest 엔티티 생성**

`PrayerRequest.java`:
```java
package com.churchhub.domain.faith.entity;

import com.churchhub.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "prayer_requests")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class PrayerRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User author;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    private boolean publicVisible = true;
    private int prayerCount = 0;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public PrayerRequest(User author, String content, boolean publicVisible) {
        this.author = author;
        this.content = content;
        this.publicVisible = publicVisible;
    }

    public void pray() { this.prayerCount++; }
}
```

- [ ] **Step 2: FaithDto에 PrayerRequest DTO 추가**

`FaithDto.java`에 내부 클래스 추가:
```java
@Getter
public static class PrayerRequestForm {
    @NotBlank private String content;
    private boolean publicVisible = true;
}

@Getter
@Builder
public static class PrayerResponse {
    private Long id;
    private String authorNickname;
    private String content;
    private boolean publicVisible;
    private int prayerCount;
    private LocalDateTime createdAt;

    public static PrayerResponse from(PrayerRequest p) {
        return PrayerResponse.builder()
                .id(p.getId())
                .authorNickname(p.getAuthor().getNickname())
                .content(p.getContent())
                .publicVisible(p.isPublicVisible())
                .prayerCount(p.getPrayerCount())
                .createdAt(p.getCreatedAt()).build();
    }
}
```
> `import com.churchhub.domain.faith.entity.PrayerRequest;` 추가

- [ ] **Step 3: PrayerRequestRepository 생성**

`PrayerRequestRepository.java`:
```java
package com.churchhub.domain.faith.repository;

import com.churchhub.domain.faith.entity.PrayerRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PrayerRequestRepository extends JpaRepository<PrayerRequest, Long> {
    List<PrayerRequest> findAllByPublicVisibleTrueOrderByCreatedAtDesc();
}
```

- [ ] **Step 4: FaithService에 기도 요청 메서드 추가**

`FaithService.java`에 추가 (기존 코드 유지):
```java
private final PrayerRequestRepository prayerRequestRepository;

public List<FaithDto.PrayerResponse> getPublicPrayers() {
    return prayerRequestRepository.findAllByPublicVisibleTrueOrderByCreatedAtDesc()
            .stream().map(FaithDto.PrayerResponse::from).toList();
}

@Transactional
public FaithDto.PrayerResponse createPrayer(Long userId, FaithDto.PrayerRequestForm req) {
    User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    PrayerRequest prayer = PrayerRequest.builder()
            .author(user).content(req.getContent()).publicVisible(req.isPublicVisible()).build();
    return FaithDto.PrayerResponse.from(prayerRequestRepository.save(prayer));
}

@Transactional
public FaithDto.PrayerResponse pray(Long prayerId) {
    PrayerRequest prayer = prayerRequestRepository.findById(prayerId)
            .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
    prayer.pray();
    return FaithDto.PrayerResponse.from(prayer);
}
```

- [ ] **Step 5: FaithController에 기도 요청 엔드포인트 추가**

`FaithController.java`에 추가:
```java
@GetMapping("/prayers")
public ApiResponse<List<FaithDto.PrayerResponse>> getPrayers() {
    return ApiResponse.success(faithService.getPublicPrayers());
}

@PostMapping("/prayers")
public ApiResponse<FaithDto.PrayerResponse> createPrayer(
        @Valid @RequestBody FaithDto.PrayerRequestForm req,
        @AuthenticationPrincipal CustomUserDetails userDetails) {
    return ApiResponse.success(faithService.createPrayer(userDetails.getUserId(), req));
}

@PostMapping("/prayers/{id}/pray")
public ApiResponse<FaithDto.PrayerResponse> pray(@PathVariable Long id) {
    return ApiResponse.success(faithService.pray(id));
}
```

- [ ] **Step 6: 빌드 확인 + Commit**

```bash
JAVA_HOME="/c/Users/taeyeop/.jdks/graalvm-jdk-21.0.7" ./gradlew compileJava
git add backend/src/main/java/com/churchhub/domain/faith/
git commit -m "feat: PrayerRequest 도메인 추가 (기도 요청·함께 기도)"
```
