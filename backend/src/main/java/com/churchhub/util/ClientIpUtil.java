package com.churchhub.util;

import jakarta.servlet.http.HttpServletRequest;

public class ClientIpUtil {

    // 요청은 Vercel rewrites를 거쳐 들어오고, Vercel은 X-Forwarded-For 첫 값을 실제 클라이언트 IP로 덮어씀.
    // Fly-Client-IP는 이 경우 Vercel의 IP라 모든 사용자가 같은 값이 되므로 쓰지 않음.
    public static String resolve(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        return request.getRemoteAddr();
    }
}
