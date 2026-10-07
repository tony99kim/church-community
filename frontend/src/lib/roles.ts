// 역할 판정은 여기서만. 백엔드 UserRole.isAdmin / isFaithMinistry 와 범위를 맞출 것

export const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: '최고관리자',
  CHURCH_MANAGER: '교회관리자',
  PASTOR: '목사',
  EVANGELIST: '전도사',
  USER: '일반회원',
};

/** 관리자 화면 접근 역할 (USER 제외 전부) */
export function isAdminRole(role?: string | null): boolean {
  return !!role && role !== 'USER' && role in ROLE_LABEL;
}

/** 신앙 Q&A·기도제목 관리 역할 (교회관리자 제외) */
export function isFaithMinistryRole(role?: string | null): boolean {
  return role === 'PASTOR' || role === 'EVANGELIST' || role === 'SUPER_ADMIN';
}

/** 소속 교회가 필요한 관리자 역할 */
export function needsChurch(role?: string | null): boolean {
  return role === 'CHURCH_MANAGER' || role === 'PASTOR' || role === 'EVANGELIST';
}
