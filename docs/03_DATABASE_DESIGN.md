# 데이터베이스 설계

> 기준: Flyway 마이그레이션 `backend/src/main/resources/db/migration/V1~V13`.
> 스키마는 Flyway만 관리함 (운영 `ddl-auto: none`, 그 외 기본 `validate`). 다음 마이그레이션 번호는 **V14**.
> V1은 기존 운영 DB 상태를 옮겨 적은 것이라 운영에서는 `baseline-on-migrate`로 건너뜀.
> enum 컬럼은 모두 `VARCHAR`이고 값은 Java enum 이름 그대로 저장됨 (DB CHECK 제약은 `users.role`, 두 대여 테이블의 `status`에만 있음).
> 모든 `id`는 `BIGSERIAL PK`, `created_at`/`updated_at`은 `TIMESTAMP`.

## 테이블 (ERD 요약)

```
churches (교회)
├── id, name(100), address(200), sunday_service_time(200), has_youth_group
├── contact_info(100), introduction(200), website_url(200), instagram_url(200)
├── image_url(300)                       ← V7
├── visible (기본 TRUE)
└── created_at, updated_at

users (회원)
├── id, email (UNIQUE), password (V11부터 NULL 허용: 소셜 계정)
├── name(30), nickname(20, UNIQUE), phone(20), profile_image_url
├── role   : USER | CHURCH_MANAGER | PASTOR | EVANGELIST | SUPER_ADMIN  (CHECK, V2·V12)
├── status : ACTIVE | SUSPENDED | DELETED
├── provider(10, 기본 'LOCAL') / provider_id(100)   ← V11 (GOOGLE, KAKAO 등)
├── church_id (FK → churches, 관리자 역할의 소속 교회)
└── created_at, updated_at

refresh_tokens (리프레시 토큰, PK 제약 없음 / 엔티티는 token을 @Id로 사용)
├── token(255), user_id (FK → users), expires_at

categories (게시판 카테고리, 계층형)
├── id, name(50), description, sort_order, visible
├── type : NOTICE | FREE | GATHERING | COMMUNITY | EVENT | LOCAL
├── parent_id (FK → categories)
└── created_at, updated_at

posts (게시글)
├── id, title(200), content(TEXT, HTML), thumbnail_url
├── status : ACTIVE | HIDDEN | DELETED
├── notice, like_count, comment_count, view_count
├── user_id (FK → users), category_id (FK → categories)
└── created_at, updated_at

post_likes        id, user_id (FK), post_id (FK), created_at
comments          id, content(TEXT), status(ACTIVE | DELETED), like_count,
                  user_id (FK), post_id (FK), parent_id (FK → comments, 대댓글), created_at, updated_at

events (행사)
├── id, title(200), description(TEXT), location(200), start_date, end_date
├── max_participants (NULL = 제한 없음), current_participants
├── status   : DRAFT | UPCOMING | ONGOING | ENDED | CANCELLED
├── category : NEIGHBORHOOD | FAITH | SERVICE | CHURCH | WELCOME_TABLE
├── thumbnail_url, user_id (FK, 작성자), church_id (FK)
└── created_at, updated_at

event_participants   id, status(REGISTERED | CANCELLED), user_id (FK), event_id (FK), created_at

spaces (대여 공간)
├── id, name(100), description(200), usage_types(200), capacity, available
├── open_time(기본 09:00), close_time(기본 21:00), slot_minutes(기본 60)
├── image_url(500)                        ← V3
├── church_id (FK)
└── created_at, updated_at

space_rentals (공간 대여 신청)
├── id, start_date_time, end_date_time, headcount, purpose(300), contact_phone(100)
├── status : PENDING | APPROVED | REJECTED | CANCELLED | RETURNED  (CHECK, V10)
├── reject_reason(300), admin_message(500) ← V6
├── user_id (FK), space_id (FK)
└── created_at

space_blocks (관리자 차단 시간)            ← V5
├── id, space_id (FK, ON DELETE CASCADE), reason(100)
├── recurring, day_of_week(1=월~7=일, 반복일 때), block_date(반복 아닐 때)
├── start_time, end_time
└── created_at

items (대여 물품)
├── id, name(100), description(300)
├── category : MOVING | CLEANING | LIVING | EVENT
├── total_quantity, available_quantity, church_id (FK)
└── created_at, updated_at

item_rentals (물품 대여 신청)
├── id, quantity, start_date, end_date (DATE), contact_phone, purpose
├── status : PENDING | APPROVED | REJECTED | CANCELLED | RETURNED  (CHECK, V10)
├── reject_reason, terms_agreed
├── user_id (FK), item_id (FK)
└── created_at

item_rental_messages (대여 건 채팅)       ← V8
└── id, rental_id (FK, CASCADE), sender_id (FK), sender_role(10), content(TEXT), created_at

notifications (알림)
├── id, type(COMMENT | LIKE | EVENT | NOTICE), content(255), is_read
├── related_id, related_type(POST | COMMENT | EVENT)
├── receiver_id (FK → users), sender_id (FK → users, NULL = 시스템)
└── created_at

reports (신고)
├── id, type(POST | COMMENT | USER), target_id, reason(500)
├── status : PENDING | RESOLVED | REJECTED
├── admin_note, reporter_id (FK)
└── created_at

welcome_kits (웰컴 키트 신청)
├── id, name(50), phone(20), address(200), message(300), processed
├── user_id (FK, ON DELETE SET NULL), admin_message(500)  ← V4
└── created_at

faith_questions          id, content(TEXT), anonymous, public_visible, user_id (FK), created_at
faith_answers            id, content(TEXT), question_id (FK), pastor_id (FK → users), created_at
faith_question_messages  id, question_id (FK, CASCADE), sender_id (FK), sender_role(10), content, created_at  ← V8
prayer_requests          id, content(TEXT), public_visible, prayer_count, admin_prayed(V6), user_id (FK), created_at

conversations (DM 대화방)                 ← V9
├── id, user_id (FK, 시작한 쪽), pastor_id (FK, 상대방 — 컬럼명과 달리 아무 회원 가능)
├── faith_question_id (FK, ON DELETE SET NULL)
└── last_message_at, created_at

conversation_messages    id, conversation_id (FK, CASCADE), sender_id (FK), content(TEXT), is_read, created_at  ← V9
```

## 마이그레이션 이력

| 버전 | 내용 |
|------|------|
| V1 | 초기 스키마 (위 테이블 중 V3 이후 추가분 제외) |
| V2 | `users.role` CHECK에 CHURCH_MANAGER, PASTOR 포함 |
| V3 | `spaces.image_url` |
| V4 | `welcome_kits.user_id`, `admin_message` |
| V5 | `space_blocks` |
| V6 | `prayer_requests.admin_prayed`, `space_rentals.admin_message` |
| V7 | `churches.image_url` |
| V8 | `item_rental_messages`, `faith_question_messages` |
| V9 | `conversations`, `conversation_messages` (+ 인덱스 3개) |
| V10 | 두 대여 테이블 `status` CHECK에 RETURNED 추가 |
| V11 | `users.provider`, `provider_id`, `password` NULL 허용 |
| V12 | `users.role` CHECK에 EVANGELIST 추가 |
| V13 | 자주 쓰는 FK·목록 조건 인덱스 |

## 인덱스 (V9, V13)

PostgreSQL은 FK에 인덱스를 자동으로 만들지 않아 V13에서 추가함.

| 테이블 | 인덱스 |
|--------|--------|
| posts | `(category_id, status, created_at DESC)`, `(status, created_at DESC)`, `(user_id)` |
| post_likes | `(post_id, user_id)` (UNIQUE 아님) |
| comments | `(post_id)` |
| notifications | `(receiver_id, is_read, created_at DESC)` |
| event_participants | `(event_id)`, `(user_id)` |
| space_rentals | `(space_id, start_date_time, end_date_time)`, `(user_id)`, `(status)` |
| item_rentals | `(item_id)`, `(user_id)`, `(status)` |
| reports | `(status, created_at DESC)` |
| faith_answers | `(question_id)` |
| refresh_tokens | `(user_id)` |
| space_blocks / item_rental_messages / faith_question_messages | 각 부모 FK |
| conversations (V9) | `(user_id)`, `(pastor_id)` |
| conversation_messages (V9) | `(conversation_id, created_at)` |

- 마이그레이션이 만드는 UNIQUE 제약은 `users.email`, `users.nickname`뿐임. 엔티티에는 `post_likes(post_id, user_id)`, `event_participants(event_id, user_id)` `@UniqueConstraint`가 선언돼 있지만 마이그레이션에는 없음 (운영 DB에 예전 Hibernate 자동 생성으로 남아 있는지는 저장소로 확인 불가). 중복은 서비스 코드에서도 확인함
- 초기 데이터(seed) 마이그레이션은 없음. 카테고리·교회 등은 관리자 화면에서 등록
