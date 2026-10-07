package com.churchhub.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;

class RateLimitFilterTest {

    @Test
    void 경로별로_한도가_정해짐() {
        assertThat(RateLimitFilter.tierOf("/api/v1/auth/login")).isEqualTo(RateLimitFilter.Tier.LOGIN);
        assertThat(RateLimitFilter.tierOf("/api/v1/auth/register")).isEqualTo(RateLimitFilter.Tier.LOGIN);
        assertThat(RateLimitFilter.tierOf("/api/v1/auth/refresh")).isEqualTo(RateLimitFilter.Tier.AUTH);
        assertThat(RateLimitFilter.tierOf("/api/v1/posts")).isEqualTo(RateLimitFilter.Tier.GENERAL);
    }

    @Test
    void refresh를_먼저_불러도_로그인_한도는_10회() throws Exception {
        RateLimitFilter filter = new RateLimitFilter();
        call(filter, "/api/v1/auth/refresh");
        int ok = 0;
        for (int i = 0; i < 15; i++) {
            if (call(filter, "/api/v1/auth/login") == 200) ok++;
        }
        assertThat(ok).isEqualTo(10);
    }

    @Test
    void 오래된_버킷은_정리됨() throws Exception {
        RateLimitFilter filter = new RateLimitFilter();
        call(filter, "/api/v1/posts");
        assertThat(filter.size()).isEqualTo(1);
        filter.evictIdle();
        assertThat(filter.size()).isEqualTo(1); // 방금 쓴 버킷은 유지
    }

    private int call(RateLimitFilter filter, String path) throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest("POST", path);
        req.addHeader("X-Forwarded-For", "1.2.3.4");
        MockHttpServletResponse res = new MockHttpServletResponse();
        filter.doFilter(req, res, new MockFilterChain());
        return res.getStatus();
    }
}
