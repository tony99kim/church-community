package com.churchhub.util;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseCookie;

public class CookieUtil {

    public static ResponseCookie access(String token, long maxAgeSeconds) {
        return build("access_token", token, maxAgeSeconds);
    }

    public static ResponseCookie refresh(String token, long maxAgeSeconds) {
        return build("refresh_token", token, maxAgeSeconds);
    }

    public static ResponseCookie delete(String name) {
        return build(name, "", 0);
    }

    public static String resolve(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        for (Cookie c : cookies) {
            if (name.equals(c.getName())) return c.getValue();
        }
        return null;
    }

    // 프론트가 Vercel rewrites로 API를 같은 도메인에서 부르므로 Lax로 충분하고,
    // 다른 사이트에서 보낸 POST에는 쿠키가 실리지 않아 CSRF가 막힘
    private static ResponseCookie build(String name, String value, long maxAge) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(true)
                .sameSite("Lax")
                .path("/")
                .maxAge(maxAge)
                .build();
    }
}
