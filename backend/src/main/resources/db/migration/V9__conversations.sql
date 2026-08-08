CREATE TABLE conversations (
    id                BIGSERIAL PRIMARY KEY,
    user_id           BIGINT NOT NULL REFERENCES users(id),
    pastor_id         BIGINT NOT NULL REFERENCES users(id),
    faith_question_id BIGINT REFERENCES faith_questions(id) ON DELETE SET NULL,
    last_message_at   TIMESTAMP,
    created_at        TIMESTAMP NOT NULL DEFAULT NOW()
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
