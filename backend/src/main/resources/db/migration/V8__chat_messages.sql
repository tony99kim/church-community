CREATE TABLE item_rental_messages (
    id         BIGSERIAL PRIMARY KEY,
    rental_id  BIGINT NOT NULL REFERENCES item_rentals(id) ON DELETE CASCADE,
    sender_id  BIGINT NOT NULL REFERENCES users(id),
    sender_role VARCHAR(10) NOT NULL,
    content    TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE faith_question_messages (
    id          BIGSERIAL PRIMARY KEY,
    question_id BIGINT NOT NULL REFERENCES faith_questions(id) ON DELETE CASCADE,
    sender_id   BIGINT NOT NULL REFERENCES users(id),
    sender_role VARCHAR(10) NOT NULL,
    content     TEXT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
