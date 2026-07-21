# 데이터베이스 설계

## ERD (Entity Relationship Diagram)

```
users (회원)
├── id (PK)
├── email (UNIQUE)
├── password (BCrypt 암호화)
├── nickname (UNIQUE)
├── profile_image_url
├── phone
├── role (ENUM: USER, ADMIN, SUPER_ADMIN)
├── status (ENUM: ACTIVE, SUSPENDED, DELETED)
├── created_at
└── updated_at

categories (게시판 카테고리)
├── id (PK)
├── name
├── description
├── type (ENUM: COMMUNITY, EVENT, LOCAL, NOTICE)
├── is_visible
├── sort_order
├── created_at
└── updated_at

posts (게시글)
├── id (PK)
├── user_id (FK → users)
├── category_id (FK → categories)
├── title
├── content (TEXT)
├── thumbnail_url
├── view_count
├── like_count
├── comment_count
├── status (ENUM: ACTIVE, HIDDEN, DELETED)
├── is_notice (공지 여부)
├── created_at
└── updated_at

comments (댓글)
├── id (PK)
├── post_id (FK → posts)
├── user_id (FK → users)
├── parent_id (FK → comments, 대댓글)
├── content
├── like_count
├── status (ENUM: ACTIVE, DELETED)
├── created_at
└── updated_at

post_likes (게시글 좋아요)
├── id (PK)
├── post_id (FK → posts)
├── user_id (FK → users)
└── created_at

comment_likes (댓글 좋아요)
├── id (PK)
├── comment_id (FK → comments)
├── user_id (FK → users)
└── created_at

events (행사)
├── id (PK)
├── user_id (FK → users, 작성자)
├── title
├── description (TEXT)
├── location
├── start_date
├── end_date
├── max_participants (참여 정원, NULL = 제한없음)
├── current_participants
├── thumbnail_url
├── status (ENUM: UPCOMING, ONGOING, ENDED, CANCELLED)
├── created_at
└── updated_at

event_participants (행사 참여자)
├── id (PK)
├── event_id (FK → events)
├── user_id (FK → users)
├── status (ENUM: REGISTERED, CANCELLED)
└── created_at

notifications (알림)
├── id (PK)
├── user_id (FK → users, 수신자)
├── sender_id (FK → users, 발신자)
├── type (ENUM: COMMENT, LIKE, EVENT, NOTICE)
├── content
├── related_id (연관된 게시글/댓글 ID)
├── related_type (ENUM: POST, COMMENT, EVENT)
├── is_read
├── created_at

files (첨부파일)
├── id (PK)
├── original_name
├── stored_name
├── file_url
├── file_size
├── file_type
├── related_id
├── related_type (ENUM: POST, EVENT, PROFILE)
├── created_at

reports (신고)
├── id (PK)
├── reporter_id (FK → users, 신고자)
├── target_id (신고 대상 ID)
├── target_type (ENUM: POST, COMMENT, USER)
├── reason
├── status (ENUM: PENDING, RESOLVED, DISMISSED)
├── created_at
└── resolved_at

refresh_tokens (리프레시 토큰)
├── id (PK)
├── user_id (FK → users)
├── token (UNIQUE)
├── expires_at
└── created_at
```

## 인덱스 전략

```sql
-- 성능 최적화를 위한 인덱스
CREATE INDEX idx_posts_category_id ON posts(category_id);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_status ON posts(status);

CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_status ON events(status);

-- 복합 인덱스
CREATE UNIQUE INDEX idx_post_likes_unique ON post_likes(post_id, user_id);
CREATE UNIQUE INDEX idx_comment_likes_unique ON comment_likes(comment_id, user_id);
CREATE UNIQUE INDEX idx_event_participants_unique ON event_participants(event_id, user_id);
```

## 초기 데이터 (Seed Data)

```sql
-- 기본 카테고리
INSERT INTO categories (name, description, type, sort_order) VALUES
('공지사항', '교회 공지사항', 'NOTICE', 1),
('자유게시판', '자유롭게 이야기해요', 'COMMUNITY', 2),
('나눔게시판', '물품 나눔, 재능 나눔', 'COMMUNITY', 3),
('기도제목', '서로를 위한 기도', 'COMMUNITY', 4),
('교회행사', '교회 행사 안내', 'EVENT', 5),
('지역소식', '지역 청년 모임 및 소식', 'LOCAL', 6),
('봉사활동', '봉사 활동 안내', 'LOCAL', 7);
```
