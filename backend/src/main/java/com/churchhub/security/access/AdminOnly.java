package com.churchhub.security.access;

import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/** 관리자 화면 접근 역할 전체 (User.isAdmin 과 동일) */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@PreAuthorize("hasAnyRole('PASTOR', 'EVANGELIST', 'CHURCH_MANAGER', 'SUPER_ADMIN')")
public @interface AdminOnly {
}
