package com.churchhub.domain.auth.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.UUID;

/**
 * 소셜 로그인 일회용 코드 저장소.
 * 소셜 로그인은 백엔드 도메인에서 끝나므로 거기서 쿠키를 구우면 프론트 도메인에서 쓸 수 없음.
 * 코드만 넘기고 프론트가 같은 도메인(/api 프록시)으로 교환해 쿠키가 프론트 도메인에 설정되도록 함.
 */
@Component
@RequiredArgsConstructor
public class OAuthCodeStore {

    private static final String PREFIX = "oauth:code:";
    private static final Duration TTL = Duration.ofSeconds(60);

    private final StringRedisTemplate redisTemplate;

    public String create(Long userId) {
        String code = UUID.randomUUID().toString();
        redisTemplate.opsForValue().set(PREFIX + code, String.valueOf(userId), TTL);
        return code;
    }

    /** 한 번만 쓸 수 있음. 없거나 만료면 null */
    public Long consume(String code) {
        if (code == null || code.isBlank()) return null;
        String userId = redisTemplate.opsForValue().getAndDelete(PREFIX + code);
        return userId == null ? null : Long.valueOf(userId);
    }
}
