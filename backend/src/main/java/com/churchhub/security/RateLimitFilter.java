package com.churchhub.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    private Bucket newBucket(String path) {
        // 인증 엔드포인트는 분당 10회로 제한 (brute force 방지)
        if (path.startsWith("/api/v1/auth/login") || path.startsWith("/api/v1/auth/register")) {
            return Bucket.builder()
                    .addLimit(Bandwidth.builder().capacity(10).refillGreedy(10, Duration.ofMinutes(1)).build())
                    .build();
        }
        // 일반 API: 분당 200회
        return Bucket.builder()
                .addLimit(Bandwidth.builder().capacity(200).refillGreedy(200, Duration.ofMinutes(1)).build())
                .build();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String ip = getClientIp(request);
        String path = request.getRequestURI();
        String bucketKey = ip + ":" + (path.startsWith("/api/v1/auth/") ? "auth" : "general");

        Bucket bucket = buckets.computeIfAbsent(bucketKey, k -> newBucket(path));

        if (bucket.tryConsume(1)) {
            chain.doFilter(request, response);
        } else {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(
                    "{\"success\":false,\"message\":\"요청이 너무 많습니다. 잠시 후 다시 시도해주세요.\",\"code\":\"TOO_MANY_REQUESTS\"}"
            );
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        return request.getRemoteAddr();
    }
}
