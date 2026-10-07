package com.churchhub;

import com.churchhub.domain.user.entity.User;
import com.churchhub.domain.user.entity.UserRole;
import com.churchhub.domain.user.repository.UserRepository;
import io.zonky.test.db.AutoConfigureEmbeddedDatabase;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Flyway 마이그레이션을 실제 PostgreSQL(내장)에 적용하고, Redis는 목으로 대체한 통합 테스트 기반 */
@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureEmbeddedDatabase(provider = AutoConfigureEmbeddedDatabase.DatabaseProvider.ZONKY,
        type = AutoConfigureEmbeddedDatabase.DatabaseType.POSTGRES)
public abstract class IntegrationTestBase {

    protected static final String PASSWORD = "password123!";

    @Autowired protected MockMvc mockMvc;
    @Autowired protected UserRepository userRepository;
    @Autowired protected PasswordEncoder passwordEncoder;

    @MockBean protected StringRedisTemplate redisTemplate;
    @SuppressWarnings("unchecked")
    protected ValueOperations<String, String> valueOps = mock(ValueOperations.class);

    @BeforeEach
    void setUpRedis() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(redisTemplate.hasKey(any())).thenReturn(false);
        when(valueOps.setIfAbsent(any(), any(), any(java.time.Duration.class))).thenReturn(true);
    }

    protected User createUser(UserRole role) {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        User user = User.builder()
                .email("u" + suffix + "@test.com")
                .password(passwordEncoder.encode(PASSWORD))
                .nickname("n" + suffix)
                .build();
        user.changeRole(role);
        return userRepository.save(user);
    }

    /** 로그인 후 응답 쿠키(access_token, refresh_token)를 돌려줌 */
    protected Cookie[] login(User user) throws Exception {
        // 로그인 rate limit(IP당 분당 10회)에 걸리지 않도록 요청마다 다른 IP로
        MockHttpServletResponse res = mockMvc.perform(post("/api/v1/auth/login")
                        .header("X-Forwarded-For", "10.0." + (int) (Math.random() * 250) + "." + (int) (Math.random() * 250))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + user.getEmail() + "\",\"password\":\"" + PASSWORD + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse();
        return res.getCookies();
    }

    protected Cookie cookie(Cookie[] cookies, String name) {
        return Arrays.stream(cookies).filter(c -> c.getName().equals(name)).findFirst().orElseThrow();
    }
}
