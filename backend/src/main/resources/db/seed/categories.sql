-- Run manually in Supabase SQL Editor
INSERT INTO categories (name, description, type, visible, sort_order, created_at, updated_at)
VALUES
  ('공지', '운영진 공지사항', 'NOTICE', true, 1, NOW(), NOW()),
  ('자유게시판', '일상·생활 정보·잡담', 'FREE', true, 2, NOW(), NOW()),
  ('소모임 모집', '같이 밥·운동·산책 등 모집', 'GATHERING', true, 3, NOW(), NOW())
ON CONFLICT DO NOTHING;
