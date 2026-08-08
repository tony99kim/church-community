# Phase 1: 채팅 메시지 기능 완성 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 미커밋 상태의 채팅 메시지 기능(물품대여↔관리자, 신앙질문↔목사님)을 커밋하고, 관리자 화면에서 익명 질문의 실제 작성자가 보이도록 수정한다.

**Architecture:** 
- 백엔드: `FaithQuestionMessage` + `ItemRentalMessage` 엔티티 기반 question/rental 단위 스레드 메시지.
- 관리자 뷰는 익명 여부 무관 실제 작성자 이름 노출 (별도 DTO 파라미터로 처리).
- 프론트: My Page + Admin Faith/Items 페이지에 인라인 채팅 UI 이미 구현 완료.

**Tech Stack:** Spring Boot 3.2.5, JPA, Next.js 14, TypeScript, Tailwind

## Global Constraints
- API prefix: `/api/v1/`
- 응답 형식: `ApiResponse<T>`
- 디자인 색상: 메인 `#003478`, 배경 `#f4f6f8`, 보더 `#EDEFF1`
- Java 21 (GraalVM), 빌드: `JAVA_HOME="/c/Users/taeyeop/.jdks/graalvm-jdk-21.0.7" ./gradlew compileJava` (backend 디렉토리에서)

---

## 현황 분석 (구현 완료 목록)

코드 리뷰 결과, 아래 파일들이 **이미 완성 상태**로 미커밋 중:

**백엔드 (신규 파일):**
- `backend/src/main/resources/db/migration/V8__chat_messages.sql`
- `backend/src/main/java/com/churchhub/domain/faith/entity/FaithQuestionMessage.java`
- `backend/src/main/java/com/churchhub/domain/faith/repository/FaithQuestionMessageRepository.java`
- `backend/src/main/java/com/churchhub/domain/item/entity/ItemRentalMessage.java`
- `backend/src/main/java/com/churchhub/domain/item/repository/ItemRentalMessageRepository.java`

**백엔드 (수정 파일):**
- `FaithController.java` — `GET/POST /faith/questions/{id}/messages` 엔드포인트 추가
- `FaithDto.java` — `MessageRequest`, `MessageResponse` 추가
- `FaithService.java` — `getQuestionMessages()`, `sendQuestionMessage()` 추가
- `ItemController.java` — `GET/POST /items/rentals/{rentalId}/messages` 엔드포인트 추가
- `ItemDto.java` — `MessageRequest`, `MessageResponse` 추가
- `ItemService.java` — `getMessages()`, `sendMessage()` 추가

**프론트엔드 (수정 파일):**
- `frontend/src/types/index.ts` — `ChatMessage` 인터페이스 추가
- `frontend/src/app/(site)/my/page.tsx` — 물품/신앙질문 인라인 채팅 UI
- `frontend/src/app/admin/faith/page.tsx` — 관리자 신앙질문 채팅 UI
- `frontend/src/app/admin/items/page.tsx` — 관리자 물품대여 채팅 UI

---

## Task 1: 미커밋 작업 커밋

**Files:**
- Modify: 위 분석의 10개 파일 전부 (내용 변경 없음, git add + commit만)

- [ ] **Step 1: 변경 내용 확인**

```bash
cd C:/church-community
git diff --stat HEAD
git status --short
```

Expected: 10개 modified + 5개 untracked 파일 표시

- [ ] **Step 2: 스테이징**

```bash
cd C:/church-community
git add backend/src/main/resources/db/migration/V8__chat_messages.sql
git add backend/src/main/java/com/churchhub/domain/faith/entity/FaithQuestionMessage.java
git add backend/src/main/java/com/churchhub/domain/faith/repository/FaithQuestionMessageRepository.java
git add backend/src/main/java/com/churchhub/domain/item/entity/ItemRentalMessage.java
git add backend/src/main/java/com/churchhub/domain/item/repository/ItemRentalMessageRepository.java
git add backend/src/main/java/com/churchhub/domain/faith/api/FaithController.java
git add backend/src/main/java/com/churchhub/domain/faith/dto/FaithDto.java
git add backend/src/main/java/com/churchhub/domain/faith/service/FaithService.java
git add backend/src/main/java/com/churchhub/domain/item/api/ItemController.java
git add backend/src/main/java/com/churchhub/domain/item/dto/ItemDto.java
git add backend/src/main/java/com/churchhub/domain/item/service/ItemService.java
git add frontend/src/types/index.ts
git add frontend/src/app/\(site\)/my/page.tsx
git add frontend/src/app/admin/faith/page.tsx
git add frontend/src/app/admin/items/page.tsx
```

- [ ] **Step 3: 백엔드 컴파일 확인**

```bash
cd C:/church-community/backend
JAVA_HOME="/c/Users/taeyeop/.jdks/graalvm-jdk-21.0.7" ./gradlew compileJava
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 4: 커밋**

```bash
cd C:/church-community
git commit -m "feat: 물품대여/신앙질문 채팅 메시지 기능 추가 (V8 migration)"
```

---

## Task 2: 관리자 뷰에서 익명 질문 실제 작성자 표시

**Files:**
- Modify: `backend/src/main/java/com/churchhub/domain/faith/dto/FaithDto.java`
- Modify: `backend/src/main/java/com/churchhub/domain/faith/service/FaithService.java`

**문제:**
`QuestionResponse.from(q, answers)` 메서드가 `q.isAnonymous() ? null : q.getAuthor().getNickname()` 로 동작하여, 관리자 뷰(`getAllQuestionsForAdmin()`)에서도 익명 질문의 작성자가 null로 표시됨. 관리자(목사님)는 실제 작성자를 알아야 상담이 가능함.

**해결책:**
`from()` 메서드에 `boolean showRealAuthor` 파라미터 추가. 관리자 호출 시 `true` 전달.

- [ ] **Step 1: FaithDto.java 수정 — `from()` 오버로드 추가**

`backend/src/main/java/com/churchhub/domain/faith/dto/FaithDto.java` 의 `QuestionResponse` 클래스 내부에서:

기존:
```java
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
```

변경 후:
```java
public static QuestionResponse from(FaithQuestion q, List<FaithAnswer> answers) {
    return from(q, answers, false);
}

public static QuestionResponse from(FaithQuestion q, List<FaithAnswer> answers, boolean showRealAuthor) {
    String authorNickname = (q.isAnonymous() && !showRealAuthor)
            ? null
            : q.getAuthor().getNickname();
    return QuestionResponse.builder()
            .id(q.getId())
            .authorNickname(authorNickname)
            .anonymous(q.isAnonymous())
            .content(q.getContent())
            .publicVisible(q.isPublicVisible())
            .answers(answers.stream().map(AnswerResponse::from).toList())
            .createdAt(q.getCreatedAt()).build();
}
```

- [ ] **Step 2: FaithService.java 수정 — 관리자 메서드에 showRealAuthor=true 전달**

`getAllQuestionsForAdmin()` 메서드 수정:

기존:
```java
public List<FaithDto.QuestionResponse> getAllQuestionsForAdmin() {
    return questionRepository.findAllByOrderByCreatedAtDesc()
            .stream().map(q -> FaithDto.QuestionResponse.from(q,
                    answerRepository.findAllByQuestionIdOrderByCreatedAtAsc(q.getId())))
            .toList();
}
```

변경 후:
```java
public List<FaithDto.QuestionResponse> getAllQuestionsForAdmin() {
    return questionRepository.findAllByOrderByCreatedAtDesc()
            .stream().map(q -> FaithDto.QuestionResponse.from(q,
                    answerRepository.findAllByQuestionIdOrderByCreatedAtAsc(q.getId()), true))
            .toList();
}
```

- [ ] **Step 3: 백엔드 컴파일 확인**

```bash
cd C:/church-community/backend
JAVA_HOME="/c/Users/taeyeop/.jdks/graalvm-jdk-21.0.7" ./gradlew compileJava
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 4: 커밋**

```bash
cd C:/church-community
git add backend/src/main/java/com/churchhub/domain/faith/dto/FaithDto.java
git add backend/src/main/java/com/churchhub/domain/faith/service/FaithService.java
git commit -m "fix: 관리자 뷰에서 익명 질문 실제 작성자 표시"
```

---

## Task 3: 관리자 익명 표시 — 프론트엔드 배지 추가

**Files:**
- Modify: `frontend/src/app/admin/faith/page.tsx`

관리자 뷰에서 익명으로 등록된 질문임을 알 수 있도록 "익명" 배지 + 실제 닉네임 함께 표시.

- [ ] **Step 1: admin/faith/page.tsx 에서 질문 목록 렌더링 부분 수정**

`admin/faith/page.tsx` 에서 질문 작성자를 표시하는 부분(작성자 닉네임 표시 영역)을 찾아 아래처럼 수정:

```tsx
{/* 작성자 표시 — 익명 질문이면 배지 + 실제 닉네임 함께 표시 */}
<span className="text-xs text-gray-500">
  {q.authorNickname}
  {q.anonymous && (
    <span className="ml-1 bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded text-[10px]">익명</span>
  )}
</span>
```

- [ ] **Step 2: 커밋**

```bash
cd C:/church-community
git add frontend/src/app/admin/faith/page.tsx
git commit -m "feat: 관리자 신앙Q&A에서 익명 질문 작성자 표시 개선"
```

---

## 완료 기준

- [ ] `git log --oneline -5` 에서 3개의 새 커밋 확인
- [ ] 백엔드 `compileJava` BUILD SUCCESSFUL
- [ ] Admin Faith 페이지에서 익명 질문의 실제 닉네임 + "익명" 배지 표시
- [ ] My Page 물품 신청 탭 → 채팅 버튼 클릭 시 채팅창 열림
- [ ] My Page 신앙 질문 탭 → 채팅 버튼 클릭 시 채팅창 열림
