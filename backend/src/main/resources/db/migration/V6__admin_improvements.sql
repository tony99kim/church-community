-- 기도 요청: 관리자 기도 완료 표시
ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS admin_prayed BOOLEAN NOT NULL DEFAULT FALSE;

-- 공간 대여: 관리자 메시지
ALTER TABLE space_rentals ADD COLUMN IF NOT EXISTS admin_message VARCHAR(500);
