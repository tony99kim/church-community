package com.churchhub.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import com.churchhub.util.ClientIpUtil;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final long IDLE_EVICT_MS = Duration.ofMinutes(10).toMillis();

    private record Entry(Bucket bucket, long[] lastAccess) {}

    private final Map<String, Entry> buckets = new ConcurrentHashMap<>();

    enum Tier {
        // 로그인·회원가입: 분당 10회 (brute force 방지)
        LOGIN(10),
        // 그 밖의 인증 엔드포인트(refresh, logout 등): 분당 60회
        AUTH(60),
        // 일반 API: 분당 200회
        GENERAL(200);

        final int perMinute;
        Tier(int perMinute) { this.perMinute = perMinute; }
    }

    static Tier tierOf(String path) {
        if (path.startsWith("/api/v1/auth/login") || path.startsWith("/api/v1/auth/register")) return Tier.LOGIN;
        if (path.startsWith("/api/v1/auth/")) return Tier.AUTH;
        return Tier.GENERAL;
    }

    private static Bucket newBucket(Tier tier) {
        return Bucket.builder()
                .addLimit(Bandwidth.builder().capacity(tier.perMinute)
                        .refillGreedy(tier.perMinute, Duration.ofMinutes(1)).build())
                .build();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        Tier tier = tierOf(request.getRequestURI());
        String key = ClientIpUtil.resolve(request) + ":" + tier;
        Entry entry = buckets.computeIfAbsent(key, k -> new Entry(newBucket(tier), new long[1]));
        entry.lastAccess()[0] = System.currentTimeMillis();

        if (entry.bucket().tryConsume(1)) {
            chain.doFilter(request, response);
        } else {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(
                    "{\"success\":false,\"message\":\"요청이 너무 많습니다. 잠시 후 다시 시도해주세요.\",\"code\":\"TOO_MANY_REQUESTS\"}"
            );
        }
    }

    // 오래 쓰지 않은 버킷을 정리해 메모리가 계속 늘지 않도록
    @Scheduled(fixedDelay = 5 * 60 * 1000)
    void evictIdle() {
        long cutoff = System.currentTimeMillis() - IDLE_EVICT_MS;
        buckets.values().removeIf(e -> e.lastAccess()[0] < cutoff);
    }

    int size() {
        return buckets.size();
    }
}
