-- 자주 조회하는 외래키·목록 조건에 인덱스 추가 (PostgreSQL은 FK에 자동으로 인덱스를 만들지 않음)

CREATE INDEX IF NOT EXISTS idx_posts_category_status_created ON posts (category_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_status_created          ON posts (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user                    ON posts (user_id);

CREATE INDEX IF NOT EXISTS idx_post_likes_post_user ON post_likes (post_id, user_id);

CREATE INDEX IF NOT EXISTS idx_comments_post ON comments (post_id);

CREATE INDEX IF NOT EXISTS idx_notifications_receiver_read ON notifications (receiver_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_participants_event ON event_participants (event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user  ON event_participants (user_id);

CREATE INDEX IF NOT EXISTS idx_space_rentals_space_time ON space_rentals (space_id, start_date_time, end_date_time);
CREATE INDEX IF NOT EXISTS idx_space_rentals_user       ON space_rentals (user_id);
CREATE INDEX IF NOT EXISTS idx_space_rentals_status     ON space_rentals (status);

CREATE INDEX IF NOT EXISTS idx_item_rentals_item   ON item_rentals (item_id);
CREATE INDEX IF NOT EXISTS idx_item_rentals_user   ON item_rentals (user_id);
CREATE INDEX IF NOT EXISTS idx_item_rentals_status ON item_rentals (status);

CREATE INDEX IF NOT EXISTS idx_reports_status_created ON reports (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_faith_answers_question ON faith_answers (question_id);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens (user_id);

CREATE INDEX IF NOT EXISTS idx_space_blocks_space             ON space_blocks (space_id);
CREATE INDEX IF NOT EXISTS idx_item_rental_messages_rental    ON item_rental_messages (rental_id);
CREATE INDEX IF NOT EXISTS idx_faith_question_messages_question ON faith_question_messages (question_id);
