-- ChurchHub 초기 스키마
-- 이 파일은 현재 프로덕션 DB 상태를 기반으로 작성되었습니다.
-- 기존 DB에서는 baseline-on-migrate=true 로 건너뜁니다.

CREATE TABLE IF NOT EXISTS churches (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    address         VARCHAR(200) NOT NULL,
    sunday_service_time VARCHAR(200),
    has_youth_group BOOLEAN NOT NULL DEFAULT FALSE,
    contact_info    VARCHAR(100),
    introduction    VARCHAR(200),
    website_url     VARCHAR(200),
    instagram_url   VARCHAR(200),
    visible         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP,
    updated_at      TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id                BIGSERIAL PRIMARY KEY,
    email             VARCHAR(255) NOT NULL UNIQUE,
    password          VARCHAR(255) NOT NULL,
    name              VARCHAR(30),
    nickname          VARCHAR(20) NOT NULL UNIQUE,
    phone             VARCHAR(20),
    profile_image_url VARCHAR(255),
    role              VARCHAR(255) NOT NULL,
    status            VARCHAR(255) NOT NULL,
    church_id         BIGINT REFERENCES churches(id),
    created_at        TIMESTAMP,
    updated_at        TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    token      VARCHAR(255) NOT NULL,
    user_id    BIGINT NOT NULL REFERENCES users(id),
    expires_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL,
    type        VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    sort_order  INTEGER NOT NULL DEFAULT 0,
    visible     BOOLEAN NOT NULL DEFAULT TRUE,
    parent_id   BIGINT REFERENCES categories(id),
    created_at  TIMESTAMP,
    updated_at  TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
    id            BIGSERIAL PRIMARY KEY,
    title         VARCHAR(200) NOT NULL,
    content       TEXT NOT NULL,
    status        VARCHAR(255) NOT NULL,
    notice        BOOLEAN NOT NULL DEFAULT FALSE,
    like_count    INTEGER NOT NULL DEFAULT 0,
    comment_count INTEGER NOT NULL DEFAULT 0,
    view_count    INTEGER NOT NULL DEFAULT 0,
    thumbnail_url VARCHAR(255),
    user_id       BIGINT NOT NULL REFERENCES users(id),
    category_id   BIGINT NOT NULL REFERENCES categories(id),
    created_at    TIMESTAMP,
    updated_at    TIMESTAMP
);

CREATE TABLE IF NOT EXISTS post_likes (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT REFERENCES users(id),
    post_id    BIGINT REFERENCES posts(id),
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comments (
    id         BIGSERIAL PRIMARY KEY,
    content    TEXT NOT NULL,
    status     VARCHAR(255) NOT NULL,
    like_count INTEGER NOT NULL DEFAULT 0,
    user_id    BIGINT NOT NULL REFERENCES users(id),
    post_id    BIGINT NOT NULL REFERENCES posts(id),
    parent_id  BIGINT REFERENCES comments(id),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events (
    id                   BIGSERIAL PRIMARY KEY,
    title                VARCHAR(200) NOT NULL,
    description          TEXT NOT NULL,
    location             VARCHAR(200) NOT NULL,
    start_date           TIMESTAMP NOT NULL,
    end_date             TIMESTAMP NOT NULL,
    max_participants     INTEGER,
    current_participants INTEGER NOT NULL DEFAULT 0,
    status               VARCHAR(255) NOT NULL,
    category             VARCHAR(30),
    thumbnail_url        VARCHAR(255),
    user_id              BIGINT NOT NULL REFERENCES users(id),
    church_id            BIGINT REFERENCES churches(id),
    created_at           TIMESTAMP,
    updated_at           TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_participants (
    id         BIGSERIAL PRIMARY KEY,
    status     VARCHAR(255) NOT NULL,
    user_id    BIGINT NOT NULL REFERENCES users(id),
    event_id   BIGINT NOT NULL REFERENCES events(id),
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS spaces (
    id           BIGSERIAL PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    description  VARCHAR(200),
    usage_types  VARCHAR(200),
    capacity     INTEGER,
    available    BOOLEAN NOT NULL DEFAULT TRUE,
    open_time    TIME NOT NULL DEFAULT '09:00',
    close_time   TIME NOT NULL DEFAULT '21:00',
    slot_minutes INTEGER NOT NULL DEFAULT 60,
    church_id    BIGINT REFERENCES churches(id),
    created_at   TIMESTAMP,
    updated_at   TIMESTAMP
);

CREATE TABLE IF NOT EXISTS space_rentals (
    id             BIGSERIAL PRIMARY KEY,
    start_date_time TIMESTAMP NOT NULL,
    end_date_time   TIMESTAMP NOT NULL,
    headcount       INTEGER,
    purpose         VARCHAR(300),
    contact_phone   VARCHAR(100),
    status          VARCHAR(255) NOT NULL,
    reject_reason   VARCHAR(300),
    user_id         BIGINT NOT NULL REFERENCES users(id),
    space_id        BIGINT NOT NULL REFERENCES spaces(id),
    created_at      TIMESTAMP
);

CREATE TABLE IF NOT EXISTS items (
    id                 BIGSERIAL PRIMARY KEY,
    name               VARCHAR(100) NOT NULL,
    description        VARCHAR(300),
    category           VARCHAR(255) NOT NULL,
    total_quantity     INTEGER NOT NULL DEFAULT 1,
    available_quantity INTEGER NOT NULL DEFAULT 1,
    church_id          BIGINT REFERENCES churches(id),
    created_at         TIMESTAMP,
    updated_at         TIMESTAMP
);

CREATE TABLE IF NOT EXISTS item_rentals (
    id            BIGSERIAL PRIMARY KEY,
    quantity      INTEGER NOT NULL DEFAULT 1,
    start_date    DATE NOT NULL,
    end_date      DATE NOT NULL,
    contact_phone VARCHAR(100),
    purpose       VARCHAR(300),
    status        VARCHAR(255) NOT NULL,
    reject_reason VARCHAR(300),
    terms_agreed  BOOLEAN NOT NULL DEFAULT FALSE,
    user_id       BIGINT NOT NULL REFERENCES users(id),
    item_id       BIGINT NOT NULL REFERENCES items(id),
    created_at    TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id           BIGSERIAL PRIMARY KEY,
    type         VARCHAR(255) NOT NULL,
    content      VARCHAR(255) NOT NULL,
    is_read      BOOLEAN NOT NULL DEFAULT FALSE,
    related_id   BIGINT,
    related_type VARCHAR(255),
    receiver_id  BIGINT NOT NULL REFERENCES users(id),
    sender_id    BIGINT REFERENCES users(id),
    created_at   TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reports (
    id          BIGSERIAL PRIMARY KEY,
    type        VARCHAR(255) NOT NULL,
    target_id   BIGINT NOT NULL,
    reason      VARCHAR(500) NOT NULL,
    status      VARCHAR(255) NOT NULL,
    admin_note  VARCHAR(255),
    reporter_id BIGINT NOT NULL REFERENCES users(id),
    created_at  TIMESTAMP
);

CREATE TABLE IF NOT EXISTS welcome_kits (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(50) NOT NULL,
    phone      VARCHAR(20) NOT NULL,
    address    VARCHAR(200),
    message    VARCHAR(300),
    processed  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS faith_questions (
    id             BIGSERIAL PRIMARY KEY,
    content        TEXT NOT NULL,
    anonymous      BOOLEAN NOT NULL DEFAULT FALSE,
    public_visible BOOLEAN NOT NULL DEFAULT FALSE,
    user_id        BIGINT REFERENCES users(id),
    created_at     TIMESTAMP
);

CREATE TABLE IF NOT EXISTS faith_answers (
    id          BIGSERIAL PRIMARY KEY,
    content     TEXT NOT NULL,
    question_id BIGINT NOT NULL REFERENCES faith_questions(id),
    pastor_id   BIGINT NOT NULL REFERENCES users(id),
    created_at  TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prayer_requests (
    id             BIGSERIAL PRIMARY KEY,
    content        TEXT NOT NULL,
    public_visible BOOLEAN NOT NULL DEFAULT FALSE,
    prayer_count   INTEGER NOT NULL DEFAULT 0,
    user_id        BIGINT REFERENCES users(id),
    created_at     TIMESTAMP
);
