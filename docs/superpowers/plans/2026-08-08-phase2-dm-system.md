# Phase 2: DM 시스템 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `conversations` + `conversation_messages` 테이블 기반으로 신앙Q&A 비공개 상담 탭(A)과 독립 DM 페이지 `/messages`(B)를 구현한다. 목사님(PASTOR/SUPER_ADMIN)에게만 DM 가능.

**Architecture:**
- 새 `dm` 도메인 패키지: `Conversation` (user ↔ pastor 대화방) + `ConversationMessage` 엔티티.
- A(비공개 상담)와 B(독립 DM) 모두 같은 conversations 테이블 사용; B는 faith_question_id=null로 구분.
- 프론트: `/messages` 페이지(대화 목록+채팅), `/faith` 비공개 상담 탭, Header 미읽음 배지.

**Tech Stack:** Spring Boot 3.2.5, JPA, Next.js 14 App Router, TypeScript, Tailwind, Zustand

## Global Constraints
- API prefix: `/api/v1/`
- 응답 형식: `ApiResponse<T>` (`com.churchhub.common.response.ApiResponse`)
- 디자인: 메인 `#003478`, 배경 `#f4f6f8`, 보더 `#EDEFF1`
- 빌드: `cd backend && JAVA_HOME="/c/Users/taeyeop/.jdks/graalvm-jdk-21.0.7" ./gradlew compileJava`
- 기존 역할: `USER`, `CHURCH_MANAGER`, `PASTOR`, `SUPER_ADMIN`
- 기존 예외 패턴: `throw new BusinessException(ErrorCode.XXX)`
- 기존 패키지 루트: `com.churchhub`

---

## 파일 목록

**신규 (백엔드):**
- `backend/.../domain/dm/entity/Conversation.java`
- `backend/.../domain/dm/entity/ConversationMessage.java`
- `backend/.../domain/dm/repository/ConversationRepository.java`
- `backend/.../domain/dm/repository/ConversationMessageRepository.java`
- `backend/.../domain/dm/dto/DmDto.java`
- `backend/.../domain/dm/service/DmService.java`
- `backend/.../domain/dm/api/DmController.java`
- `backend/src/main/resources/db/migration/V9__conversations.sql`

**수정 (백엔드):**
- `backend/.../exception/ErrorCode.java` — `CONVERSATION_NOT_FOUND` 추가
- `backend/.../domain/user/repository/UserRepository.java` — `findByRoleIn` 추가
- `backend/.../domain/user/dto/UserDto.java` — `PastorInfo` inner class 추가
- `backend/.../domain/user/service/UserService.java` — `getPastors()` 추가
- `backend/.../domain/user/api/UserController.java` — `GET /users/pastors` 추가

**신규 (프론트엔드):**
- `frontend/src/app/(site)/messages/page.tsx`

**수정 (프론트엔드):**
- `frontend/src/types/index.ts` — `Conversation`, `DmMessage`, `PastorInfo` 추가
- `frontend/src/app/(site)/faith/page.tsx` — 비공개 상담 탭 추가
- `frontend/src/components/Header.tsx` — 메시지 아이콘 + 미읽음 배지 추가

---

## Task 1: V9 Migration + 백엔드 엔티티/리포지토리

**Files:**
- Create: `backend/src/main/resources/db/migration/V9__conversations.sql`
- Create: `backend/src/main/java/com/churchhub/domain/dm/entity/Conversation.java`
- Create: `backend/src/main/java/com/churchhub/domain/dm/entity/ConversationMessage.java`
- Create: `backend/src/main/java/com/churchhub/domain/dm/repository/ConversationRepository.java`
- Create: `backend/src/main/java/com/churchhub/domain/dm/repository/ConversationMessageRepository.java`
- Modify: `backend/src/main/java/com/churchhub/exception/ErrorCode.java`

**Produces:**
- `Conversation` entity with fields: id, user(User), pastor(User), faithQuestion(FaithQuestion nullable), lastMessageAt, createdAt
- `ConversationMessage` entity with fields: id, conversation(Conversation), sender(User), content, read(boolean), createdAt
- `ConversationRepository`: `findByUserIdOrderByLastMessageAtDesc`, `findByPastorIdOrderByLastMessageAtDesc`, `findByUserIdAndPastorIdAndFaithQuestionIsNull`
- `ConversationMessageRepository`: `findAllByConversationIdOrderByCreatedAtAsc`, `countUnreadInConversation`, `markAsRead`, `countUnreadForCaller`

- [ ] **Step 1: V9 migration 파일 생성**

`backend/src/main/resources/db/migration/V9__conversations.sql`:

```sql
CREATE TABLE conversations (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL REFERENCES users(id),
    pastor_id    BIGINT NOT NULL REFERENCES users(id),
    faith_question_id BIGINT REFERENCES faith_questions(id) ON DELETE SET NULL,
    last_message_at TIMESTAMP,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE conversation_messages (
    id              BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id       BIGINT NOT NULL REFERENCES users(id),
    content         TEXT NOT NULL,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversations_user   ON conversations(user_id);
CREATE INDEX idx_conversations_pastor ON conversations(pastor_id);
CREATE INDEX idx_conv_messages_conv   ON conversation_messages(conversation_id, created_at);
```

- [ ] **Step 2: Conversation 엔티티 생성**

`backend/src/main/java/com/churchhub/domain/dm/entity/Conversation.java`:

```java
package com.churchhub.domain.dm.entity;

import com.churchhub.domain.faith.entity.FaithQuestion;
import com.churchhub.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "conversations")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pastor_id", nullable = false)
    private User pastor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faith_question_id")
    private FaithQuestion faithQuestion;

    private LocalDateTime lastMessageAt;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public Conversation(User user, User pastor, FaithQuestion faithQuestion) {
        this.user = user;
        this.pastor = pastor;
        this.faithQuestion = faithQuestion;
    }

    public void updateLastMessageAt(LocalDateTime time) {
        this.lastMessageAt = time;
    }
}
```

- [ ] **Step 3: ConversationMessage 엔티티 생성**

`backend/src/main/java/com/churchhub/domain/dm/entity/ConversationMessage.java`:

```java
package com.churchhub.domain.dm.entity;

import com.churchhub.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "conversation_messages")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class ConversationMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public ConversationMessage(Conversation conversation, User sender, String content) {
        this.conversation = conversation;
        this.sender = sender;
        this.content = content;
    }
}
```

- [ ] **Step 4: ConversationRepository 생성**

`backend/src/main/java/com/churchhub/domain/dm/repository/ConversationRepository.java`:

```java
package com.churchhub.domain.dm.repository;

import com.churchhub.domain.dm.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    List<Conversation> findByUserIdOrderByLastMessageAtDesc(Long userId);
    List<Conversation> findByPastorIdOrderByLastMessageAtDesc(Long pastorId);
    Optional<Conversation> findByUserIdAndPastorIdAndFaithQuestionIsNull(Long userId, Long pastorId);
}
```

- [ ] **Step 5: ConversationMessageRepository 생성**

`backend/src/main/java/com/churchhub/domain/dm/repository/ConversationMessageRepository.java`:

```java
package com.churchhub.domain.dm.repository;

import com.churchhub.domain.dm.entity.ConversationMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ConversationMessageRepository extends JpaRepository<ConversationMessage, Long> {

    List<ConversationMessage> findAllByConversationIdOrderByCreatedAtAsc(Long conversationId);

    @Query("SELECT COUNT(m) FROM ConversationMessage m WHERE m.conversation.id = :convId AND m.sender.id != :senderId AND m.read = false")
    long countUnreadInConversation(@Param("convId") Long convId, @Param("senderId") Long senderId);

    @Modifying
    @Query("UPDATE ConversationMessage m SET m.read = true WHERE m.conversation.id = :convId AND m.sender.id != :callerId AND m.read = false")
    void markAsRead(@Param("convId") Long convId, @Param("callerId") Long callerId);

    @Query("SELECT COUNT(m) FROM ConversationMessage m WHERE (m.conversation.user.id = :callerId OR m.conversation.pastor.id = :callerId) AND m.sender.id != :callerId AND m.read = false")
    long countUnreadForCaller(@Param("callerId") Long callerId);
}
```

- [ ] **Step 6: ErrorCode에 CONVERSATION_NOT_FOUND 추가**

`backend/src/main/java/com/churchhub/exception/ErrorCode.java`에서 Space 섹션 위에 추가:

```java
    // DM
    CONVERSATION_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 대화방입니다."),
```

- [ ] **Step 7: 컴파일 확인**

```bash
cd C:/church-community/backend
JAVA_HOME="/c/Users/taeyeop/.jdks/graalvm-jdk-21.0.7" ./gradlew compileJava
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 8: 커밋**

```bash
cd C:/church-community
git add backend/src/main/resources/db/migration/V9__conversations.sql
git add backend/src/main/java/com/churchhub/domain/dm/
git add backend/src/main/java/com/churchhub/exception/ErrorCode.java
git commit -m "feat: DM 시스템 V9 migration + 엔티티/리포지토리"
```

---

## Task 2: DmService + DmController + 목사님 목록 API

**Files:**
- Create: `backend/.../domain/dm/dto/DmDto.java`
- Create: `backend/.../domain/dm/service/DmService.java`
- Create: `backend/.../domain/dm/api/DmController.java`
- Modify: `backend/.../domain/user/repository/UserRepository.java`
- Modify: `backend/.../domain/user/dto/UserDto.java`
- Modify: `backend/.../domain/user/service/UserService.java`
- Modify: `backend/.../domain/user/api/UserController.java`

**Consumes:** Task 1의 Conversation, ConversationMessage, ConversationRepository, ConversationMessageRepository

**Produces:**
- `GET  /api/v1/conversations` → `List<DmDto.ConversationResponse>`
- `POST /api/v1/conversations` → `DmDto.ConversationResponse`
- `GET  /api/v1/conversations/{id}/messages` → `List<DmDto.MessageResponse>`
- `POST /api/v1/conversations/{id}/messages` → `DmDto.MessageResponse`
- `GET  /api/v1/conversations/unread-count` → `DmDto.UnreadCountResponse`
- `GET  /api/v1/users/pastors` → `List<UserDto.PastorInfo>`

- [ ] **Step 1: DmDto 생성**

`backend/src/main/java/com/churchhub/domain/dm/dto/DmDto.java`:

```java
package com.churchhub.domain.dm.dto;

import com.churchhub.domain.dm.entity.Conversation;
import com.churchhub.domain.dm.entity.ConversationMessage;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

public class DmDto {

    @Getter
    public static class StartRequest {
        @NotNull private Long pastorId;
        private Long faithQuestionId;
        @NotBlank private String initialMessage;
    }

    @Getter
    public static class SendRequest {
        @NotBlank private String content;
    }

    @Getter
    @Builder
    public static class ConversationResponse {
        private Long id;
        private Long userId;
        private String userNickname;
        private Long pastorId;
        private String pastorNickname;
        private Long faithQuestionId;
        private String lastMessagePreview;
        private LocalDateTime lastMessageAt;
        private long unreadCount;
        private LocalDateTime createdAt;

        public static ConversationResponse from(Conversation c, String preview, long unread) {
            return ConversationResponse.builder()
                    .id(c.getId())
                    .userId(c.getUser().getId())
                    .userNickname(c.getUser().getNickname())
                    .pastorId(c.getPastor().getId())
                    .pastorNickname(c.getPastor().getNickname())
                    .faithQuestionId(c.getFaithQuestion() != null ? c.getFaithQuestion().getId() : null)
                    .lastMessagePreview(preview)
                    .lastMessageAt(c.getLastMessageAt())
                    .unreadCount(unread)
                    .createdAt(c.getCreatedAt())
                    .build();
        }
    }

    @Getter
    @Builder
    public static class MessageResponse {
        private Long id;
        private Long senderId;
        private String senderNickname;
        private String content;
        private boolean read;
        private LocalDateTime createdAt;

        public static MessageResponse from(ConversationMessage m) {
            return MessageResponse.builder()
                    .id(m.getId())
                    .senderId(m.getSender().getId())
                    .senderNickname(m.getSender().getNickname())
                    .content(m.getContent())
                    .read(m.isRead())
                    .createdAt(m.getCreatedAt())
                    .build();
        }
    }

    @Getter
    @Builder
    public static class UnreadCountResponse {
        private long count;
    }
}
```

- [ ] **Step 2: DmService 생성**

`backend/src/main/java/com/churchhub/domain/dm/service/DmService.java`:

```java
package com.churchhub.domain.dm.service;

import com.churchhub.domain.dm.dto.DmDto;
import com.churchhub.domain.dm.entity.Conversation;
import com.churchhub.domain.dm.entity.ConversationMessage;
import com.churchhub.domain.dm.repository.ConversationMessageRepository;
import com.churchhub.domain.dm.repository.ConversationRepository;
import com.churchhub.domain.faith.entity.FaithQuestion;
import com.churchhub.domain.faith.repository.FaithQuestionRepository;
import com.churchhub.domain.user.entity.User;
import com.churchhub.domain.user.entity.UserRole;
import com.churchhub.domain.user.repository.UserRepository;
import com.churchhub.exception.BusinessException;
import com.churchhub.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DmService {

    private final ConversationRepository conversationRepository;
    private final ConversationMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final FaithQuestionRepository faithQuestionRepository;

    public List<DmDto.ConversationResponse> listMyConversations(Long callerId) {
        User caller = getUser(callerId);
        List<Conversation> convs = isPastor(caller)
                ? conversationRepository.findByPastorIdOrderByLastMessageAtDesc(callerId)
                : conversationRepository.findByUserIdOrderByLastMessageAtDesc(callerId);

        return convs.stream().map(c -> {
            List<ConversationMessage> msgs = messageRepository.findAllByConversationIdOrderByCreatedAtAsc(c.getId());
            String preview = msgs.isEmpty() ? "" : msgs.get(msgs.size() - 1).getContent();
            if (preview.length() > 50) preview = preview.substring(0, 50) + "...";
            long unread = messageRepository.countUnreadInConversation(c.getId(), callerId);
            return DmDto.ConversationResponse.from(c, preview, unread);
        }).toList();
    }

    @Transactional
    public DmDto.ConversationResponse startConversation(Long callerId, DmDto.StartRequest req) {
        User caller = getUser(callerId);
        if (isPastor(caller)) throw new BusinessException(ErrorCode.FORBIDDEN);

        User pastor = userRepository.findById(req.getPastorId())
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        if (!isPastor(pastor)) throw new BusinessException(ErrorCode.FORBIDDEN);

        Conversation conv;
        if (req.getFaithQuestionId() != null) {
            FaithQuestion question = faithQuestionRepository.findById(req.getFaithQuestionId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
            conv = conversationRepository.save(
                    Conversation.builder().user(caller).pastor(pastor).faithQuestion(question).build());
        } else {
            conv = conversationRepository
                    .findByUserIdAndPastorIdAndFaithQuestionIsNull(callerId, req.getPastorId())
                    .orElseGet(() -> conversationRepository.save(
                            Conversation.builder().user(caller).pastor(pastor).build()));
        }

        String content = req.getInitialMessage();
        messageRepository.save(ConversationMessage.builder()
                .conversation(conv).sender(caller).content(content).build());
        conv.updateLastMessageAt(LocalDateTime.now());

        return DmDto.ConversationResponse.from(conv, content, 0);
    }

    @Transactional
    public List<DmDto.MessageResponse> getMessages(Long convId, Long callerId) {
        Conversation conv = getConversationWithAccess(convId, callerId);
        messageRepository.markAsRead(convId, callerId);
        return messageRepository.findAllByConversationIdOrderByCreatedAtAsc(conv.getId())
                .stream().map(DmDto.MessageResponse::from).toList();
    }

    @Transactional
    public DmDto.MessageResponse sendMessage(Long convId, Long callerId, String content) {
        Conversation conv = getConversationWithAccess(convId, callerId);
        User caller = getUser(callerId);
        ConversationMessage msg = messageRepository.save(
                ConversationMessage.builder().conversation(conv).sender(caller).content(content).build());
        conv.updateLastMessageAt(LocalDateTime.now());
        return DmDto.MessageResponse.from(msg);
    }

    public DmDto.UnreadCountResponse getUnreadCount(Long callerId) {
        return DmDto.UnreadCountResponse.builder()
                .count(messageRepository.countUnreadForCaller(callerId))
                .build();
    }

    private Conversation getConversationWithAccess(Long convId, Long callerId) {
        Conversation conv = conversationRepository.findById(convId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CONVERSATION_NOT_FOUND));
        boolean isParticipant = conv.getUser().getId().equals(callerId)
                || conv.getPastor().getId().equals(callerId);
        if (!isParticipant) throw new BusinessException(ErrorCode.FORBIDDEN);
        return conv;
    }

    private boolean isPastor(User user) {
        return user.getRole() == UserRole.PASTOR || user.getRole() == UserRole.SUPER_ADMIN;
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }
}
```

- [ ] **Step 3: DmController 생성**

`backend/src/main/java/com/churchhub/domain/dm/api/DmController.java`:

```java
package com.churchhub.domain.dm.api;

import com.churchhub.common.response.ApiResponse;
import com.churchhub.domain.dm.dto.DmDto;
import com.churchhub.domain.dm.service.DmService;
import com.churchhub.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/conversations")
@RequiredArgsConstructor
public class DmController {

    private final DmService dmService;

    @GetMapping
    public ApiResponse<List<DmDto.ConversationResponse>> listMyConversations(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(dmService.listMyConversations(userDetails.getUserId()));
    }

    @PostMapping
    public ApiResponse<DmDto.ConversationResponse> startConversation(
            @Valid @RequestBody DmDto.StartRequest req,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(dmService.startConversation(userDetails.getUserId(), req));
    }

    @GetMapping("/{id}/messages")
    public ApiResponse<List<DmDto.MessageResponse>> getMessages(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(dmService.getMessages(id, userDetails.getUserId()));
    }

    @PostMapping("/{id}/messages")
    public ApiResponse<DmDto.MessageResponse> sendMessage(
            @PathVariable Long id,
            @Valid @RequestBody DmDto.SendRequest req,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(dmService.sendMessage(id, userDetails.getUserId(), req.getContent()));
    }

    @GetMapping("/unread-count")
    public ApiResponse<DmDto.UnreadCountResponse> getUnreadCount(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(dmService.getUnreadCount(userDetails.getUserId()));
    }
}
```

- [ ] **Step 4: UserRepository에 목사 조회 메서드 추가**

`UserRepository.java` 하단 import 목록 아래에 메서드 추가:

```java
import com.churchhub.domain.user.entity.UserRole;
import java.util.List;
// ... 기존 import 유지 ...

// 인터페이스 내부에 추가:
List<User> findByRoleInAndStatus(List<UserRole> roles, UserStatus status);
```

- [ ] **Step 5: UserDto에 PastorInfo 추가**

`UserDto.java` 내부에 추가 (기존 클래스 마지막에):

```java
    @Getter
    @Builder
    public static class PastorInfo {
        private Long id;
        private String nickname;
        private String churchName;

        public static PastorInfo from(User u) {
            return PastorInfo.builder()
                    .id(u.getId())
                    .nickname(u.getNickname())
                    .churchName(u.getChurch() != null ? u.getChurch().getName() : null)
                    .build();
        }
    }
```

- [ ] **Step 6: UserService에 getPastors() 추가**

`UserService.java` 내부에 추가:

```java
import com.churchhub.domain.user.entity.UserRole;
import java.util.List;

// 메서드 추가:
public List<UserDto.PastorInfo> getPastors() {
    return userRepository.findByRoleInAndStatus(
                    List.of(UserRole.PASTOR, UserRole.SUPER_ADMIN), UserStatus.ACTIVE)
            .stream().map(UserDto.PastorInfo::from).toList();
}
```

- [ ] **Step 7: UserController에 GET /users/pastors 추가**

`UserController.java` 내부에 추가:

```java
@GetMapping("/pastors")
public ApiResponse<List<UserDto.PastorInfo>> getPastors() {
    return ApiResponse.success(userService.getPastors());
}
```

- [ ] **Step 8: 컴파일 확인**

```bash
cd C:/church-community/backend
JAVA_HOME="/c/Users/taeyeop/.jdks/graalvm-jdk-21.0.7" ./gradlew compileJava
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 9: 커밋**

```bash
cd C:/church-community
git add backend/src/main/java/com/churchhub/domain/dm/
git add backend/src/main/java/com/churchhub/domain/user/
git commit -m "feat: DM 서비스/컨트롤러 + 목사님 목록 API"
```

---

## Task 3: 프론트엔드 타입 + /messages 페이지

**Files:**
- Modify: `frontend/src/types/index.ts`
- Create: `frontend/src/app/(site)/messages/page.tsx`

**Consumes:**
- `GET /api/v1/conversations` → `Conversation[]`
- `GET /api/v1/conversations/{id}/messages` → `DmMessage[]`
- `POST /api/v1/conversations/{id}/messages` body `{ content }` → `DmMessage`

**Produces:** `/messages` 페이지 — 대화 목록 + 인라인 채팅 UI

- [ ] **Step 1: types/index.ts에 타입 추가**

`frontend/src/types/index.ts` 하단에 추가:

```typescript
// DM / Conversations
export interface Conversation {
  id: number;
  userId: number;
  userNickname: string;
  pastorId: number;
  pastorNickname: string;
  faithQuestionId: number | null;
  lastMessagePreview: string;
  lastMessageAt: string | null;
  unreadCount: number;
  createdAt: string;
}

export interface DmMessage {
  id: number;
  senderId: number;
  senderNickname: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface PastorInfo {
  id: number;
  nickname: string;
  churchName: string | null;
}
```

- [ ] **Step 2: /messages 페이지 생성**

`frontend/src/app/(site)/messages/page.tsx`:

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { Conversation, DmMessage } from '@/types';

export default function MessagesPage() {
  const router = useRouter();
  const { user, isLoggedIn, hydrated } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!isLoggedIn) { router.replace('/login'); return; }
    api.get('/conversations')
      .then(r => setConversations(r.data.data ?? []))
      .finally(() => setLoading(false));
  }, [hydrated, isLoggedIn]);

  const openConversation = async (convId: number) => {
    setSelectedId(convId);
    const res = await api.get(`/conversations/${convId}/messages`);
    setMessages(res.data.data ?? []);
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, unreadCount: 0 } : c));
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const sendMessage = async () => {
    const content = msgInput.trim();
    if (!content || !selectedId) return;
    setSending(true);
    try {
      await api.post(`/conversations/${selectedId}/messages`, { content });
      setMsgInput('');
      const res = await api.get(`/conversations/${selectedId}/messages`);
      setMessages(res.data.data ?? []);
      const convRes = await api.get('/conversations');
      setConversations(convRes.data.data ?? []);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } finally {
      setSending(false);
    }
  };

  const selected = conversations.find(c => c.id === selectedId);
  const counterpart = selected
    ? (user?.id === selected.userId ? selected.pastorNickname : selected.userNickname)
    : null;

  if (!hydrated || loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">불러오는 중...</div>;
  }

  return (
    <main className="min-h-screen bg-[#f4f6f8]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[#003478] mb-6">메시지 💬</h1>
        <div className="flex gap-4 h-[600px]">

          {/* 대화 목록 */}
          <div className="w-72 shrink-0 bg-white rounded-2xl border border-[#EDEFF1] overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-[#EDEFF1] font-semibold text-sm text-gray-700">
              대화 목록
            </div>
            {conversations.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-400 text-center px-4">
                <div>
                  <div className="text-3xl mb-2">💬</div>
                  <p>아직 대화가 없습니다.</p>
                  <p className="text-xs mt-1">신앙 Q&A에서 비공개 상담을 시작해보세요.</p>
                </div>
              </div>
            ) : (
              <ul className="flex-1 overflow-y-auto divide-y divide-gray-50">
                {conversations.map(c => {
                  const name = user?.id === c.userId ? c.pastorNickname : c.userNickname;
                  return (
                    <li key={c.id}>
                      <button
                        onClick={() => openConversation(c.id)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${selectedId === c.id ? 'bg-blue-50' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-[#003478] rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-sm font-semibold text-gray-900 truncate">{name}</span>
                              {c.unreadCount > 0 && (
                                <span className="ml-1 shrink-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                  {c.unreadCount > 9 ? '9+' : c.unreadCount}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 truncate">{c.lastMessagePreview}</p>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* 채팅 영역 */}
          <div className="flex-1 bg-white rounded-2xl border border-[#EDEFF1] overflow-hidden flex flex-col">
            {!selectedId ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                대화를 선택하세요
              </div>
            ) : (
              <>
                <div className="px-4 py-3 border-b border-[#EDEFF1] flex items-center gap-2">
                  <div className="w-7 h-7 bg-[#003478] rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {counterpart?.[0]}
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{counterpart}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && (
                    <p className="text-xs text-gray-400 text-center">메시지가 없습니다.</p>
                  )}
                  {messages.map(m => {
                    const isMine = m.senderId === user?.id;
                    return (
                      <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[72%] rounded-2xl px-4 py-2.5 text-sm ${isMine ? 'bg-[#003478] text-white' : 'bg-gray-100 text-gray-800'}`}>
                          {!isMine && (
                            <div className="text-[10px] text-gray-500 mb-0.5 font-medium">{m.senderNickname}</div>
                          )}
                          <p className="leading-relaxed">{m.content}</p>
                          <div className={`text-[10px] mt-1 ${isMine ? 'text-blue-200' : 'text-gray-400'}`}>
                            {new Date(m.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
                <div className="px-4 py-3 border-t border-[#EDEFF1] flex gap-2">
                  <input
                    value={msgInput}
                    onChange={e => setMsgInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                    placeholder="메시지를 입력하세요..."
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !msgInput.trim()}
                    className="px-4 py-2.5 bg-[#003478] text-white rounded-xl text-sm font-medium hover:bg-blue-900 disabled:opacity-50 transition"
                  >
                    전송
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: 커밋**

```bash
cd C:/church-community
git add frontend/src/types/index.ts
git add "frontend/src/app/(site)/messages/page.tsx"
git commit -m "feat: /messages DM 페이지 + Conversation/DmMessage 타입"
```

---

## Task 4: /faith 비공개 상담 탭 (A type)

**Files:**
- Modify: `frontend/src/app/(site)/faith/page.tsx`

**Consumes:**
- `GET /api/v1/users/pastors` → `PastorInfo[]`
- `POST /api/v1/conversations` body `{ pastorId, initialMessage }` → `Conversation`

**Produces:** `/faith` 페이지에 "비공개 상담" 탭 추가 — 목사님 선택 + 메시지 작성 → DM 생성 후 /messages로 이동

- [ ] **Step 1: faith/page.tsx 수정**

`frontend/src/app/(site)/faith/page.tsx` 파일을 열어 다음을 수정:

**1) import에 `useRouter` 추가:**
```tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';  // 추가
import api from '@/lib/api';
import { FaithQuestion, PrayerRequest, PastorInfo } from '@/types';
import { useAuthStore } from '@/store/authStore';
```

**2) 타입 정의 수정:**
```tsx
type Tab = 'questions' | 'prayers' | 'consult';  // 'consult' 추가
```

**3) 상태 변수 추가 (기존 useState들 아래에):**
```tsx
const router = useRouter();
const [pastors, setPastors] = useState<PastorInfo[]>([]);
const [consultForm, setConsultForm] = useState({ pastorId: '', message: '' });
const [consultLoading, setConsultLoading] = useState(false);
```

**4) useEffect 내부에 목사 목록 fetch 추가:**
```tsx
useEffect(() => {
  Promise.all([
    api.get('/faith/questions').then(r => setQuestions(r.data.data ?? [])),
    api.get('/faith/prayers').then(r => setPrayers(r.data.data ?? [])),
    api.get('/users/pastors').then(r => setPastors(r.data.data ?? [])),  // 추가
  ]).finally(() => setLoading(false));
}, []);
```

**5) 비공개 상담 제출 함수 추가 (submitPrayer 함수 아래에):**
```tsx
const submitConsult = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!consultForm.pastorId || !consultForm.message.trim()) return;
  setConsultLoading(true);
  try {
    const res = await api.post('/conversations', {
      pastorId: Number(consultForm.pastorId),
      initialMessage: consultForm.message,
    });
    router.push(`/messages?convId=${res.data.data.id}`);
  } catch {
    alert('메시지 전송에 실패했습니다. 다시 시도해주세요.');
  } finally {
    setConsultLoading(false);
  }
};
```

**6) 탭 버튼 목록에 비공개 상담 탭 추가 (기존 탭 렌더링 부분):**

기존:
```tsx
<div className="flex gap-2 mb-6">
  <button onClick={() => setTab('questions')} className={...}>신앙 질문</button>
  <button onClick={() => setTab('prayers')} className={...}>기도 요청</button>
</div>
```

변경:
```tsx
<div className="flex gap-2 mb-6">
  <button onClick={() => setTab('questions')}
    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'questions' ? 'bg-[#003478] text-white' : 'bg-white border border-[#EDEFF1] text-gray-600 hover:border-[#003478]'}`}>
    신앙 질문
  </button>
  <button onClick={() => setTab('prayers')}
    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'prayers' ? 'bg-[#003478] text-white' : 'bg-white border border-[#EDEFF1] text-gray-600 hover:border-[#003478]'}`}>
    기도 요청
  </button>
  <button onClick={() => setTab('consult')}
    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'consult' ? 'bg-[#003478] text-white' : 'bg-white border border-[#EDEFF1] text-gray-600 hover:border-[#003478]'}`}>
    비공개 상담 🔒
  </button>
</div>
```

**7) 비공개 상담 탭 UI 추가 (기존 탭 콘텐츠 블록들 뒤에):**

```tsx
{tab === 'consult' && (
  <div className="space-y-4">
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
      목사님께 개인적으로 질문하거나 상담을 요청할 수 있습니다. 대화 내용은 상대방과 나만 볼 수 있습니다.
    </div>
    {!isLoggedIn ? (
      <div className="bg-white rounded-2xl border border-[#EDEFF1] p-8 text-center">
        <p className="text-sm text-gray-500 mb-4">비공개 상담은 로그인 후 이용할 수 있습니다.</p>
        <a href="/login" className="inline-block px-5 py-2.5 bg-[#003478] text-white rounded-lg text-sm font-medium hover:bg-blue-900 transition">
          로그인하기
        </a>
      </div>
    ) : (
      <form onSubmit={submitConsult} className="bg-white rounded-2xl border border-[#EDEFF1] p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">상담 목사님 선택</label>
          <select
            required
            value={consultForm.pastorId}
            onChange={e => setConsultForm(p => ({ ...p, pastorId: e.target.value }))}
            className="w-full border border-[#EDEFF1] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]"
          >
            <option value="">목사님을 선택하세요</option>
            {pastors.map(p => (
              <option key={p.id} value={p.id}>
                {p.nickname}{p.churchName ? ` (${p.churchName})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">상담 내용</label>
          <textarea
            required
            rows={5}
            placeholder="상담하고 싶은 내용을 적어주세요..."
            value={consultForm.message}
            onChange={e => setConsultForm(p => ({ ...p, message: e.target.value }))}
            className="w-full border border-[#EDEFF1] rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#003478]"
          />
        </div>
        <button
          type="submit"
          disabled={consultLoading || !consultForm.pastorId || !consultForm.message.trim()}
          className="w-full py-3 bg-[#003478] text-white rounded-xl text-sm font-semibold hover:bg-blue-900 disabled:opacity-50 transition"
        >
          {consultLoading ? '전송 중...' : '비공개 상담 시작하기'}
        </button>
      </form>
    )}
  </div>
)}
```

- [ ] **Step 2: 커밋**

```bash
cd C:/church-community
git add "frontend/src/app/(site)/faith/page.tsx"
git commit -m "feat: 신앙 Q&A 비공개 상담 탭 추가 (목사님 DM 연결)"
```

---

## Task 5: Header 메시지 아이콘 + 미읽음 배지

**Files:**
- Modify: `frontend/src/components/Header.tsx`

**Consumes:** `GET /api/v1/conversations/unread-count` → `{ count: number }`

**Produces:** Header에 메시지 아이콘 버튼 + 미읽음 수 배지 (알림 벨 옆에 위치)

- [ ] **Step 1: Header.tsx 수정**

`frontend/src/components/Header.tsx`에서 다음 변경:

**1) state 추가 (unreadCount 아래에):**
```tsx
const [unreadDmCount, setUnreadDmCount] = useState(0);
```

**2) fetchUnread 함수 내부에 DM 미읽음 fetch 추가:**
```tsx
const fetchUnread = useCallback(() => {
  if (!isLoggedIn) return;
  api.get('/notifications/unread-count').then((r) => setUnreadCount(r.data.data.count));
  api.get('/conversations/unread-count').then((r) => setUnreadDmCount(r.data.data.count)).catch(() => {});  // 추가
}, [isLoggedIn]);
```

**3) 알림 벨 `<div className="relative" ref={notiRef}>` 바로 앞에 메시지 아이콘 버튼 추가:**
```tsx
{/* 메시지 아이콘 */}
<Link href="/messages" className="relative p-1.5 text-gray-500 hover:text-[#003478] transition">
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 16c0 .928-.32 1.781-.845 2.455A3 3 0 0118 19H6a3 3 0 01-2.155-.545A3.992 3.992 0 013 16V8a4 4 0 014-4h10a4 4 0 014 4v8z" />
  </svg>
  {unreadDmCount > 0 && (
    <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
      {unreadDmCount > 9 ? '9+' : unreadDmCount}
    </span>
  )}
</Link>
```

**4) 모바일 드롭다운 메뉴에 메시지 링크 추가** (내 정보 Link 바로 아래):
```tsx
<Link href="/messages" className="block py-2 text-sm font-medium text-gray-700 hover:text-[#003478]" onClick={() => setMenuOpen(false)}>메시지</Link>
```

- [ ] **Step 2: 커밋**

```bash
cd C:/church-community
git add frontend/src/components/Header.tsx
git commit -m "feat: Header 메시지 아이콘 + DM 미읽음 배지"
```

---

## 완료 기준

- [ ] `git log --oneline -5`에서 5개의 새 커밋 확인
- [ ] `compileJava BUILD SUCCESSFUL`
- [ ] `/messages` 페이지 접속 시 대화 목록 표시
- [ ] `/faith` → "비공개 상담" 탭 → 목사님 선택 → 메시지 전송 → `/messages` 이동
- [ ] Header 메시지 아이콘 클릭 시 `/messages` 이동, 미읽음 있으면 배지 표시
- [ ] 목사님 계정으로 로그인 시 `/messages`에서 받은 상담 목록 확인
