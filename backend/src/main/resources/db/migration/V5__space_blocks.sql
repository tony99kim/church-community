CREATE TABLE IF NOT EXISTS space_blocks (
    id BIGSERIAL PRIMARY KEY,
    space_id BIGINT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
    reason VARCHAR(100) NOT NULL,
    recurring BOOLEAN NOT NULL DEFAULT FALSE,
    day_of_week SMALLINT,         -- 1=월 ~ 7=일 (recurring=true 일때만 사용)
    block_date DATE,              -- recurring=false 일때만 사용
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
