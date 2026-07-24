-- UserRole enum이 CHURCH_MANAGER, PASTOR를 포함하도록 check constraint 수정
-- (Hibernate ddl-auto:update 시절 USER/ADMIN/SUPER_ADMIN만 포함된 채 생성됨)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('USER', 'CHURCH_MANAGER', 'PASTOR', 'SUPER_ADMIN'));
