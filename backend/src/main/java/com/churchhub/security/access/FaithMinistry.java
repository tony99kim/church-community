package com.churchhub.security.access;

import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/** 신앙 Q&A·기도제목 관리: 목회자만 (CHURCH_MANAGER 제외) */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@PreAuthorize("hasAnyRole('PASTOR', 'EVANGELIST', 'SUPER_ADMIN')")
public @interface FaithMinistry {
}
