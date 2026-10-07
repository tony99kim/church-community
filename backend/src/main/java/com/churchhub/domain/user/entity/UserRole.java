package com.churchhub.domain.user.entity;

public enum UserRole {
    USER, CHURCH_MANAGER, PASTOR, EVANGELIST, SUPER_ADMIN;

    /** 관리자 화면 접근 역할. security.access.AdminOnly 와 같은 범위 */
    public boolean isAdmin() {
        return this != USER;
    }

    /** 신앙 Q&A·기도제목 관리 역할. security.access.FaithMinistry 와 같은 범위 */
    public boolean isFaithMinistry() {
        return this == PASTOR || this == EVANGELIST || this == SUPER_ADMIN;
    }
}
