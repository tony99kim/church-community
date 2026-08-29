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

    private static ResponseCookie build(String name, String value, long maxAge) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(true)
                .sameSite("None")
                .path("/")
                .maxAge(maxAge)
                .build();
    }
}
