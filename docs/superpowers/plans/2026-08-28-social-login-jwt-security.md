# Social Login (Google/Kakao) + JWT 보안 강화 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Google/Kakao OAuth2 소셜 로그인 추가 + 로그아웃 시 access token 블랙리스트로 JWT 보안 완성

**Architecture:** Spring Security OAuth2 Client로 소셜 로그인 처리, `OAuth2SuccessHandler`에서 기존 JWT를 발급해 프론트 콜백 URL로 리다이렉트. Redis(기존 연결됨)로 access token 블랙리스트 관리.

**Tech Stack:** Spring Security OAuth2 Client, Spring Data Redis, Next.js 14 App Router

## Global Constraints

- Java 21, Spring Boot 3.2.5, Spring Security 6
- API prefix: `/api/v1/`, 응답: `ApiResponse<T>`
- 프론트 배포: `https://church-community-zeta.vercel.app`
- 백엔드 배포: `https://churchhub-backend.fly.dev`
- 다음 Flyway 마이그레이션 번호: **V11**
- 빌드: `JAVA_HOME="/c/Users/taeyeop/.jdks/graalvm-jdk-21.0.7" ./gradlew compileJava` (backend 디렉토리에서)
- 메인 블루: `#003478`
- `ErrorCode` enum: `backend/src/main/java/com/churchhub/exception/ErrorCode.java`

---

## 파일 구조

**신규 생성:**
- `backend/src/main/resources/db/migration/V11__add_oauth_fields.sql`
- `backend/src/main/java/com/churchhub/security/oauth2/OAuth2UserInfo.java`
- `backend/src/main/java/com/churchhub/security/oauth2/GoogleOAuth2UserInfo.java`
- `backend/src/main/java/com/churchhub/security/oauth2/KakaoOAuth2UserInfo.java`
- `backend/src/main/java/com/churchhub/security/oauth2/CustomOAuth2UserService.java`
- `backend/src/main/java/com/churchhub/security/oauth2/OAuth2SuccessHandler.java`
- `backend/src/main/java/com/churchhub/security/oauth2/OAuth2FailureHandler.java`
- `frontend/src/app/auth/callback/page.tsx`

**수정:**
- `backend/build.gradle` — `spring-boot-starter-oauth2-client` 추가
- `backend/src/main/resources/application.yml` — OAuth2 registration + blacklist key prefix
- `backend/src/main/resources/application-prod.yml` — 환경변수 참조
- `backend/src/main/java/com/churchhub/domain/user/entity/User.java` — `provider`, `providerId` 추가, `password` nullable
- `backend/src/main/java/com/churchhub/security/JwtTokenProvider.java` — `getRemainingExpiry()` 추가
- `backend/src/main/java/com/churchhub/security/JwtAuthenticationFilter.java` — 블랙리스트 체크
- `backend/src/main/java/com/churchhub/domain/auth/service/AuthService.java` — blacklist 저장
- `backend/src/main/java/com/churchhub/domain/auth/api/AuthController.java` — access token 전달
- `backend/src/main/java/com/churchhub/config/SecurityConfig.java` — oauth2Login 추가
- `frontend/src/app/(site)/login/page.tsx` — 소셜 로그인 버튼 추가

---

### Task 1: V11 DB Migration + User 엔티티 OAuth 지원

**Files:**
- Create: `backend/src/main/resources/db/migration/V11__add_oauth_fields.sql`
- Modify: `backend/src/main/java/com/churchhub/domain/user/entity/User.java`

**Interfaces:**
- Produces: `User.fromOAuth(String email, String nickname, String profileImageUrl, String provider, String providerId)` static factory — Task 2에서 사용

---

- [ ] **Step 1: V11 마이그레이션 파일 작성**

```sql
-- V11__add_oauth_fields.sql
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS provider     VARCHAR(10) NOT NULL DEFAULT 'LOCAL',
    ADD COLUMN IF NOT EXISTS provider_id  VARCHAR(100);

ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
```

- [ ] **Step 2: User 엔티티 수정**

`backend/src/main/java/com/churchhub/domain/user/entity/User.java` 전체를 아래로 교체:

```java
package com.churchhub.domain.user.entity;

import com.churchhub.domain.church.entity.Church;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column                          // OAuth 유저는 null
    private String password;

    @Column(nullable = false, unique = true, length = 20)
    private String nickname;

    @Column(length = 30)
    private String name;

    @Column(length = 20)
    private String phone;

    private String profileImageUrl;

    @Column(nullable = false, length = 10)
    private String provider = "LOCAL";

    @Column(length = 100)
    private String providerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role = UserRole.USER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status = UserStatus.ACTIVE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "church_id")
    private Church church;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Builder
    public User(String email, String password, String nickname, String name, String phone) {
        this.email = email;
        this.password = password;
        this.nickname = nickname;
        this.name = name != null ? name : nickname;
        this.phone = phone;
        this.provider = "LOCAL";
    }

    // OAuth 유저 생성 전용 팩토리 메서드
    public static User fromOAuth(String email, String nickname, String profileImageUrl,
                                  String provider, String providerId) {
        User user = new User();
        user.email = email;
        user.nickname = nickname;
        user.name = nickname;
        user.profileImageUrl = profileImageUrl;
        user.provider = provider;
        user.providerId = providerId;
        user.role = UserRole.USER;
        user.status = UserStatus.ACTIVE;
        return user;
    }

    public void updateOAuthProfile(String nickname, String profileImageUrl) {
        if (profileImageUrl != null) this.profileImageUrl = profileImageUrl;
    }

    public void updateProfile(String nickname, String name, String phone, String profileImageUrl) {
        if (nickname != null) this.nickname = nickname;
        if (name != null) this.name = name;
        if (phone != null) this.phone = phone;
        if (profileImageUrl != null) this.profileImageUrl = profileImageUrl;
    }

    public void changePassword(String encodedPassword) {
        this.password = encodedPassword;
    }

    public void changeRole(UserRole role) {
        this.role = role;
    }

    public void changeStatus(UserStatus status) {
        this.status = status;
    }

    public boolean isActive() {
        return this.status == UserStatus.ACTIVE;
    }

    public boolean isAdmin() {
        return this.role == UserRole.PASTOR || this.role == UserRole.CHURCH_MANAGER
                || this.role == UserRole.SUPER_ADMIN;
    }

    public void assignChurch(Church church) {
        this.church = church;
    }

    public void anonymize() {
        this.email = "deleted_" + this.id + "@deleted.invalid";
        this.nickname = "탈퇴회원_" + this.id;
        this.name = "탈퇴회원";
        this.phone = null;
        this.profileImageUrl = null;
        this.password = "";
        this.status = UserStatus.DELETED;
    }
}
```

- [ ] **Step 3: 빌드 확인**

```bash
cd backend
JAVA_HOME="/c/Users/taeyeop/.jdks/graalvm-jdk-21.0.7" ./gradlew compileJava
```

Expected: BUILD SUCCESSFUL

- [ ] **Step 4: Commit**

```bash
git add backend/src/main/resources/db/migration/V11__add_oauth_fields.sql \
        backend/src/main/java/com/churchhub/domain/user/entity/User.java
git commit -m "feat: add OAuth provider fields to User entity (V11 migration)"
```

---

### Task 2: build.gradle + application.yml OAuth2 설정

**Files:**
- Modify: `backend/build.gradle`
- Modify: `backend/src/main/resources/application.yml`
- Modify: `backend/src/main/resources/application-prod.yml`

**Interfaces:**
- Produces: `${GOOGLE_CLIENT_ID}`, `${GOOGLE_CLIENT_SECRET}`, `${KAKAO_CLIENT_ID}`, `${KAKAO_CLIENT_SECRET}`, `${OAUTH2_REDIRECT_URL}` 환경변수 참조 — Task 3에서 사용

---

- [ ] **Step 1: build.gradle에 OAuth2 의존성 추가**

`dependencies` 블록 내 `// Spring Boot` 섹션에 추가:

```groovy
implementation 'org.springframework.boot:spring-boot-starter-oauth2-client'
```

- [ ] **Step 2: application.yml에 OAuth2 설정 추가**

파일 맨 아래에 추가 (기존 `logging` 섹션 다음):

```yaml
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: ${GOOGLE_CLIENT_ID:dev-google-client-id}
            client-secret: ${GOOGLE_CLIENT_SECRET:dev-google-client-secret}
            scope: email, profile
          kakao:
            client-id: ${KAKAO_CLIENT_ID:dev-kakao-client-id}
            client-secret: ${KAKAO_CLIENT_SECRET:dev-kakao-client-secret}
            redirect-uri: "{baseUrl}/login/oauth2/code/kakao"
            client-authentication-method: client_secret_post
            authorization-grant-type: authorization_code
            scope: profile_nickname, account_email
        provider:
          kakao:
            authorization-uri: https://kauth.kakao.com/oauth/authorize
            token-uri: https://kauth.kakao.com/oauth/token
            user-info-uri: https://kapi.kakao.com/v2/user/me
            user-name-attribute: id

oauth2:
  redirect-url: ${OAUTH2_REDIRECT_URL:http://localhost:3000/auth/callback}
```

주의: `spring.security.oauth2` 블록은 기존 `spring:` 블록 안에 들어가야 함. 즉 `spring:` 하위에 `  security:` 들여쓰기로.

완성된 `application.yml` 최종 형태:
```yaml
spring:
  profiles:
    active: ${SPRING_PROFILES_ACTIVE:dev}
  jpa:
    hibernate:
      ddl-auto: ${DDL_AUTO:update}
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true
    show-sql: false
    open-in-view: false
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}
      password: ${REDIS_PASSWORD:}
      ssl:
        enabled: ${REDIS_SSL:false}
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: ${GOOGLE_CLIENT_ID:dev-google-client-id}
            client-secret: ${GOOGLE_CLIENT_SECRET:dev-google-client-secret}
            scope: email, profile
          kakao:
            client-id: ${KAKAO_CLIENT_ID:dev-kakao-client-id}
            client-secret: ${KAKAO_CLIENT_SECRET:dev-kakao-client-secret}
            redirect-uri: "{baseUrl}/login/oauth2/code/kakao"
            client-authentication-method: client_secret_post
            authorization-grant-type: authorization_code
            scope: profile_nickname, account_email
        provider:
          kakao:
            authorization-uri: https://kauth.kakao.com/oauth/authorize
            token-uri: https://kauth.kakao.com/oauth/token
            user-info-uri: https://kapi.kakao.com/v2/user/me
            user-name-attribute: id
  jackson:
    serialization:
      write-dates-as-timestamps: false
  servlet:
    multipart:
      max-file-size: 5MB
      max-request-size: 10MB

jwt:
  secret: ${JWT_SECRET:local-dev-secret-key-must-be-at-least-256-bits-long-for-hs256}
  access-expiry: ${JWT_ACCESS_EXPIRY:900000}
  refresh-expiry: ${JWT_REFRESH_EXPIRY:604800000}

cors:
  allowed-origins: ${CORS_ALLOWED_ORIGINS:http://localhost:3000,http://localhost:3001}

oauth2:
  redirect-url: ${OAUTH2_REDIRECT_URL:http://localhost:3000/auth/callback}

management:
  endpoint:
    health:
      show-details: when-authorized

springdoc:
  api-docs:
    path: /api-docs
  swagger-ui:
    path: /swagger-ui.html

logging:
  level:
    com.churchhub: INFO
```

- [ ] **Step 3: application-prod.yml 확인**

`application-prod.yml`을 열어서 아래 환경변수가 Fly.io secrets로 들어올 것임을 확인. 파일에는 별도 추가 불필요 (application.yml의 `${VAR:default}`로 이미 처리됨).

필요한 Fly.io secrets:
```
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
KAKAO_CLIENT_ID
KAKAO_CLIENT_SECRET
OAUTH2_REDIRECT_URL=https://church-community-zeta.vercel.app/auth/callback
```

나중에 배포 시 `fly secrets set GOOGLE_CLIENT_ID=... --app churchhub-backend` 로 설정.

- [ ] **Step 4: 빌드 확인**

```bash
cd backend
JAVA_HOME="/c/Users/taeyeop/.jdks/graalvm-jdk-21.0.7" ./gradlew compileJava
```

Expected: BUILD SUCCESSFUL

- [ ] **Step 5: Commit**

```bash
git add backend/build.gradle backend/src/main/resources/application.yml
git commit -m "feat: add OAuth2 client dependency and configuration"
```

---

### Task 3: OAuth2 백엔드 핵심 구현

**Files:**
- Create: `backend/src/main/java/com/churchhub/security/oauth2/OAuth2UserInfo.java`
- Create: `backend/src/main/java/com/churchhub/security/oauth2/GoogleOAuth2UserInfo.java`
- Create: `backend/src/main/java/com/churchhub/security/oauth2/KakaoOAuth2UserInfo.java`
- Create: `backend/src/main/java/com/churchhub/security/oauth2/CustomOAuth2UserService.java`
- Create: `backend/src/main/java/com/churchhub/security/oauth2/OAuth2SuccessHandler.java`
- Create: `backend/src/main/java/com/churchhub/security/oauth2/OAuth2FailureHandler.java`
- Modify: `backend/src/main/java/com/churchhub/config/SecurityConfig.java`

**Interfaces:**
- Consumes: `User.fromOAuth(...)` (Task 1), `JwtTokenProvider.createAccessToken/createRefreshToken` (기존), `RefreshTokenRepository` (기존)
- Produces: `/oauth2/authorization/google`, `/oauth2/authorization/kakao` — 프론트에서 링크할 URL

---

- [ ] **Step 1: OAuth2UserInfo 인터페이스 작성**

```java
// backend/src/main/java/com/churchhub/security/oauth2/OAuth2UserInfo.java
package com.churchhub.security.oauth2;

public interface OAuth2UserInfo {
    String getProviderId();
    String getProvider();
    String getEmail();
    String getNickname();
    String getProfileImageUrl();
}
```

- [ ] **Step 2: GoogleOAuth2UserInfo 작성**

Google 응답 구조: `{ "sub": "...", "email": "...", "name": "...", "picture": "..." }`

```java
// backend/src/main/java/com/churchhub/security/oauth2/GoogleOAuth2UserInfo.java
package com.churchhub.security.oauth2;

import java.util.Map;

public class GoogleOAuth2UserInfo implements OAuth2UserInfo {

    private final Map<String, Object> attributes;

    public GoogleOAuth2UserInfo(Map<String, Object> attributes) {
        this.attributes = attributes;
    }

    @Override public String getProviderId()      { return (String) attributes.get("sub"); }
    @Override public String getProvider()        { return "GOOGLE"; }
    @Override public String getEmail()           { return (String) attributes.get("email"); }
    @Override public String getNickname()        { return (String) attributes.get("name"); }
    @Override public String getProfileImageUrl() { return (String) attributes.get("picture"); }
}
```

- [ ] **Step 3: KakaoOAuth2UserInfo 작성**

Kakao 응답 구조:
```json
{
  "id": 12345678,
  "kakao_account": {
    "email": "...",
    "profile": { "nickname": "...", "profile_image_url": "..." }
  }
}
```

```java
// backend/src/main/java/com/churchhub/security/oauth2/KakaoOAuth2UserInfo.java
package com.churchhub.security.oauth2;

import java.util.Map;

public class KakaoOAuth2UserInfo implements OAuth2UserInfo {

    private final Map<String, Object> attributes;

    public KakaoOAuth2UserInfo(Map<String, Object> attributes) {
        this.attributes = attributes;
    }

    @Override
    public String getProviderId() {
        return String.valueOf(attributes.get("id"));
    }

    @Override public String getProvider() { return "KAKAO"; }

    @Override
    @SuppressWarnings("unchecked")
    public String getEmail() {
        Map<String, Object> account = (Map<String, Object>) attributes.get("kakao_account");
        return account != null ? (String) account.get("email") : null;
    }

    @Override
    @SuppressWarnings("unchecked")
    public String getNickname() {
        Map<String, Object> account = (Map<String, Object>) attributes.get("kakao_account");
        if (account == null) return "카카오유저";
        Map<String, Object> profile = (Map<String, Object>) account.get("profile");
        return profile != null ? (String) profile.get("nickname") : "카카오유저";
    }

    @Override
    @SuppressWarnings("unchecked")
    public String getProfileImageUrl() {
        Map<String, Object> account = (Map<String, Object>) attributes.get("kakao_account");
        if (account == null) return null;
        Map<String, Object> profile = (Map<String, Object>) account.get("profile");
        return profile != null ? (String) profile.get("profile_image_url") : null;
    }
}
```

- [ ] **Step 4: CustomOAuth2UserService 작성**

OAuth2 로그인 시 DB에서 유저를 찾거나 신규 생성한다. 닉네임 중복 시 providerId 뒤 4자리를 붙여 해결.

```java
// backend/src/main/java/com/churchhub/security/oauth2/CustomOAuth2UserService.java
package com.churchhub.security.oauth2;

import com.churchhub.domain.user.entity.User;
import com.churchhub.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        String userNameAttributeName = userRequest.getClientRegistration()
                .getProviderDetails().getUserInfoEndpoint().getUserNameAttributeName();

        OAuth2UserInfo userInfo = switch (registrationId) {
            case "google" -> new GoogleOAuth2UserInfo(oAuth2User.getAttributes());
            case "kakao"  -> new KakaoOAuth2UserInfo(oAuth2User.getAttributes());
            default -> throw new OAuth2AuthenticationException("지원하지 않는 소셜 로그인: " + registrationId);
        };

        User user = userRepository.findByProviderAndProviderId(userInfo.getProvider(), userInfo.getProviderId())
                .orElseGet(() -> createOAuthUser(userInfo));

        if (!user.isActive()) {
            throw new OAuth2AuthenticationException("정지된 계정입니다.");
        }

        // userId를 attributes에 담아 SuccessHandler에서 꺼낼 수 있게 함
        Map<String, Object> enriched = new java.util.HashMap<>(oAuth2User.getAttributes());
        enriched.put("_userId", user.getId());
        enriched.put("_role", user.getRole().name());

        return new DefaultOAuth2User(
                Collections.singleton(() -> "ROLE_" + user.getRole().name()),
                enriched,
                userNameAttributeName
        );
    }

    private User createOAuthUser(OAuth2UserInfo info) {
        String nickname = resolveUniqueNickname(info.getNickname(), info.getProviderId());
        User user = User.fromOAuth(info.getEmail(), nickname, info.getProfileImageUrl(),
                info.getProvider(), info.getProviderId());
        return userRepository.save(user);
    }

    private String resolveUniqueNickname(String base, String providerId) {
        // 닉네임 20자 제한, 특수문자 제거
        String clean = base.replaceAll("[^가-힣a-zA-Z0-9_]", "");
        if (clean.isEmpty()) clean = "user";
        if (clean.length() > 16) clean = clean.substring(0, 16);

        String candidate = clean;
        if (!userRepository.existsByNickname(candidate)) return candidate;

        // 충돌 시 providerId 뒤 4자리 붙임
        String suffix = providerId.length() >= 4
                ? providerId.substring(providerId.length() - 4)
                : providerId;
        candidate = clean + "_" + suffix;
        if (candidate.length() > 20) candidate = candidate.substring(0, 20);

        // 그래도 충돌이면 숫자 랜덤
        if (userRepository.existsByNickname(candidate)) {
            candidate = clean.substring(0, Math.min(clean.length(), 14))
                    + "_" + (int)(Math.random() * 9000 + 1000);
        }
        return candidate;
    }
}
```

- [ ] **Step 5: UserRepository에 `findByProviderAndProviderId` 추가**

`backend/src/main/java/com/churchhub/domain/user/repository/UserRepository.java`를 열어서 메서드 추가:

```java
Optional<User> findByProviderAndProviderId(String provider, String providerId);
```

- [ ] **Step 6: OAuth2SuccessHandler 작성**

OAuth2 로그인 성공 시 JWT 발급 → 프론트 콜백 URL로 리다이렉트.

```java
// backend/src/main/java/com/churchhub/security/oauth2/OAuth2SuccessHandler.java
package com.churchhub.security.oauth2;

import com.churchhub.domain.auth.entity.RefreshToken;
import com.churchhub.domain.auth.repository.RefreshTokenRepository;
import com.churchhub.security.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${oauth2.redirect-url}")
    private String redirectUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        Long userId = (Long) oAuth2User.getAttribute("_userId");
        String role  = (String) oAuth2User.getAttribute("_role");

        String accessToken  = jwtTokenProvider.createAccessToken(userId, role);
        String refreshToken = jwtTokenProvider.createRefreshToken(userId);

        long refreshTtlSec = jwtTokenProvider.getRefreshExpiry() / 1000;
        refreshTokenRepository.save(new RefreshToken(refreshToken, userId, refreshTtlSec));

        String targetUrl = UriComponentsBuilder.fromUriString(redirectUrl)
                .queryParam("accessToken", accessToken)
                .queryParam("refreshToken", refreshToken)
                .queryParam("expiresIn", jwtTokenProvider.getAccessExpiry() / 1000)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
```

- [ ] **Step 7: OAuth2FailureHandler 작성**

```java
// backend/src/main/java/com/churchhub/security/oauth2/OAuth2FailureHandler.java
package com.churchhub.security.oauth2;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Slf4j
@Component
public class OAuth2FailureHandler extends SimpleUrlAuthenticationFailureHandler {

    @Value("${oauth2.redirect-url}")
    private String redirectUrl;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request,
                                        HttpServletResponse response,
                                        AuthenticationException exception) throws IOException {
        log.warn("OAuth2 login failed: {}", exception.getMessage());

        // 프론트의 /auth/callback?error=true 로 리다이렉트
        String base = redirectUrl.replace("/auth/callback", "");
        String targetUrl = UriComponentsBuilder.fromUriString(base + "/auth/callback")
                .queryParam("error", "oauth_failed")
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
```

- [ ] **Step 8: SecurityConfig 업데이트**

`SecurityConfig.java` 전체를 아래로 교체:

```java
package com.churchhub.config;

import com.churchhub.security.CustomUserDetailsService;
import com.churchhub.security.JwtAuthenticationFilter;
import com.churchhub.security.JwtTokenProvider;
import com.churchhub.security.oauth2.CustomOAuth2UserService;
import com.churchhub.security.oauth2.OAuth2FailureHandler;
import com.churchhub.security.oauth2.OAuth2SuccessHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;
    private final CustomUserDetailsService userDetailsService;
    private final CustomOAuth2UserService oAuth2UserService;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final OAuth2FailureHandler oAuth2FailureHandler;
    private final StringRedisTemplate redisTemplate;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public AuthenticationManager authenticationManager() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return new ProviderManager(provider);
    }

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter(jwtTokenProvider, userDetailsService, redisTemplate);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/posts/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/categories/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/events/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/comments/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/churches/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/spaces/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/items/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/faith/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/welcome/kit").permitAll()
                .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/api-docs/**", "/webjars/**").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/api/v1/admin/**").hasAnyRole("PASTOR", "CHURCH_MANAGER", "SUPER_ADMIN")
                .anyRequest().authenticated()
            )
            .oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(info -> info.userService(oAuth2UserService))
                .successHandler(oAuth2SuccessHandler)
                .failureHandler(oAuth2FailureHandler)
            )
            .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
```

- [ ] **Step 9: 빌드 확인**

```bash
cd backend
JAVA_HOME="/c/Users/taeyeop/.jdks/graalvm-jdk-21.0.7" ./gradlew compileJava
```

Expected: BUILD SUCCESSFUL

- [ ] **Step 10: Commit**

```bash
git add backend/src/main/java/com/churchhub/security/oauth2/ \
        backend/src/main/java/com/churchhub/config/SecurityConfig.java \
        backend/src/main/java/com/churchhub/domain/user/repository/UserRepository.java
git commit -m "feat: implement OAuth2 social login (Google + Kakao)"
```

---

### Task 4: Access Token 블랙리스트 (로그아웃 보안 강화)

현재 logout은 refresh token만 삭제한다. access token은 만료될 때까지 유효하므로, Redis에 블랙리스트를 저장해 즉시 무효화한다.

**Files:**
- Modify: `backend/src/main/java/com/churchhub/security/JwtTokenProvider.java`
- Modify: `backend/src/main/java/com/churchhub/security/JwtAuthenticationFilter.java`
- Modify: `backend/src/main/java/com/churchhub/domain/auth/service/AuthService.java`
- Modify: `backend/src/main/java/com/churchhub/domain/auth/api/AuthController.java`

**Interfaces:**
- Consumes: `StringRedisTemplate` (이미 SecurityConfig에서 주입됨, 동일 bean)
- Produces: Redis key `bl:{accessToken}` TTL = access token 남은 만료시간

---

- [ ] **Step 1: JwtTokenProvider에 getRemainingExpiry 추가**

`JwtTokenProvider.java`에 메서드 추가 (기존 `validateToken` 메서드 다음):

```java
public long getRemainingExpiryMs(String token) {
    try {
        Date expiration = getClaims(token).getExpiration();
        long remaining = expiration.getTime() - System.currentTimeMillis();
        return Math.max(remaining, 0);
    } catch (Exception e) {
        return 0;
    }
}
```

import 추가 필요: `import java.util.Date;` (이미 있을 가능성 높음, 확인)

- [ ] **Step 2: JwtAuthenticationFilter 수정 — 블랙리스트 체크 추가**

`JwtAuthenticationFilter.java` 전체를 아래로 교체:

```java
package com.churchhub.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final CustomUserDetailsService userDetailsService;
    private final StringRedisTemplate redisTemplate;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String token = resolveToken(request);

        if (token != null
                && jwtTokenProvider.validateToken(token)
                && jwtTokenProvider.isAccessToken(token)
                && !isBlacklisted(token)) {

            Long userId = jwtTokenProvider.getUserId(token);
            UserDetails userDetails = userDetailsService.loadUserById(userId);
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    private boolean isBlacklisted(String token) {
        return Boolean.TRUE.equals(redisTemplate.hasKey("bl:" + token));
    }

    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
```

- [ ] **Step 3: AuthService 수정 — logout에 블랙리스트 저장**

`AuthService.java`에서 의존성과 logout 메서드를 수정:

클래스 필드에 추가:
```java
private final StringRedisTemplate redisTemplate;
```

import 추가:
```java
import org.springframework.data.redis.core.StringRedisTemplate;
import java.util.concurrent.TimeUnit;
```

`logout` 메서드를 아래로 교체:
```java
@Transactional
public void logout(Long userId, String accessToken) {
    refreshTokenRepository.deleteAllByUserId(userId);
    if (accessToken != null) {
        long remainingMs = jwtTokenProvider.getRemainingExpiryMs(accessToken);
        if (remainingMs > 0) {
            redisTemplate.opsForValue().set("bl:" + accessToken, "1", remainingMs, TimeUnit.MILLISECONDS);
        }
    }
}
```

- [ ] **Step 4: AuthController 수정 — access token을 AuthService에 전달**

`AuthController.java`에서 `logout` 메서드를 아래로 교체:

```java
import jakarta.servlet.http.HttpServletRequest;
// 기존 import에 추가

@Operation(summary = "로그아웃")
@PostMapping("/logout")
public ResponseEntity<ApiResponse<Void>> logout(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                  HttpServletRequest request) {
    String accessToken = resolveToken(request);
    authService.logout(userDetails.getUserId(), accessToken);
    return ResponseEntity.ok(ApiResponse.success("로그아웃되었습니다.", null));
}

private String resolveToken(HttpServletRequest request) {
    String bearerToken = request.getHeader("Authorization");
    if (org.springframework.util.StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
        return bearerToken.substring(7);
    }
    return null;
}
```

- [ ] **Step 5: 빌드 확인**

```bash
cd backend
JAVA_HOME="/c/Users/taeyeop/.jdks/graalvm-jdk-21.0.7" ./gradlew compileJava
```

Expected: BUILD SUCCESSFUL

- [ ] **Step 6: 동작 검증 (자가 점검)**

로컬 Redis가 없으면 아래 중 하나:
- Docker로 임시 실행: `docker run -d -p 6379:6379 redis`
- 또는 DEV 환경에서 Redis 연결 없이 테스트 시 `RedisConnectionException` 발생하면 Task 4 코드는 올바름 (Redis 없을 때 연결 실패가 정상)

- [ ] **Step 7: Commit**

```bash
git add backend/src/main/java/com/churchhub/security/JwtTokenProvider.java \
        backend/src/main/java/com/churchhub/security/JwtAuthenticationFilter.java \
        backend/src/main/java/com/churchhub/domain/auth/service/AuthService.java \
        backend/src/main/java/com/churchhub/domain/auth/api/AuthController.java
git commit -m "feat: blacklist access token on logout via Redis"
```

---

### Task 5: Frontend — 소셜 로그인 버튼 + OAuth 콜백 페이지

**Files:**
- Modify: `frontend/src/app/(site)/login/page.tsx` — Google/Kakao 버튼 추가
- Create: `frontend/src/app/auth/callback/page.tsx` — 토큰 수신 및 저장

**Interfaces:**
- Consumes: `NEXT_PUBLIC_API_URL` 환경변수 (백엔드 URL), `saveTokens` (기존 `@/lib/api`), `useAuthStore.setUser` (기존)
- Produces: `/auth/callback?accessToken=...&refreshToken=...&expiresIn=...` 처리

---

- [ ] **Step 1: .env.local에 백엔드 URL 확인**

`frontend/.env.local` (또는 `.env.development`)에 아래 변수가 있는지 확인. 없으면 추가:

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Vercel 배포 환경에는:
```
NEXT_PUBLIC_API_URL=https://churchhub-backend.fly.dev
```

- [ ] **Step 2: 로그인 페이지에 소셜 로그인 버튼 추가**

`frontend/src/app/(site)/login/page.tsx`의 `LoginForm` 함수에서, 기존 `<div className="mt-6 text-center ...">` 아직 회원이 아니신가요? 섹션 **위에** 아래 코드를 삽입:

기존:
```tsx
          <div className="mt-6 text-center text-sm text-gray-500">
            아직 회원이 아니신가요?{' '}
```

교체 후 (소셜 로그인 섹션 + 구분선 추가):
```tsx
          {/* 소셜 로그인 */}
          <div className="mt-6">
            <div className="relative flex items-center">
              <div className="flex-grow border-t border-gray-200" />
              <span className="mx-3 text-xs text-gray-400 whitespace-nowrap">또는 소셜 로그인</span>
              <div className="flex-grow border-t border-gray-200" />
            </div>
            <div className="mt-4 flex flex-col gap-3">
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL}/oauth2/authorization/google`}
                className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google로 로그인
              </a>
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL}/oauth2/authorization/kakao`}
                className="w-full flex items-center justify-center gap-3 rounded-xl py-3 text-sm font-medium text-gray-800 hover:opacity-90 transition"
                style={{ backgroundColor: '#FEE500' }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#3C1E1E">
                  <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.717 1.742 5.1 4.373 6.494l-1.113 4.058c-.098.359.296.645.603.435L10.74 19.1A11.34 11.34 0 0012 19.2c5.523 0 10-3.477 10-7.8C22 6.477 17.523 3 12 3z"/>
                </svg>
                카카오로 로그인
              </a>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            아직 회원이 아니신가요?{' '}
```

- [ ] **Step 3: OAuth 콜백 페이지 작성**

백엔드 `OAuth2SuccessHandler`가 리다이렉트하는 `{FRONTEND_URL}/auth/callback?accessToken=...` 를 처리한다.

```tsx
// frontend/src/app/auth/callback/page.tsx
'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { saveTokens } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

function OAuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();

  useEffect(() => {
    const accessToken  = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const error        = searchParams.get('error');

    if (error || !accessToken || !refreshToken) {
      router.replace('/login?error=oauth_failed');
      return;
    }

    saveTokens(accessToken, refreshToken, true);

    // 토큰 저장 후 /api/v1/users/me 로 유저 정보 조회
    api.get('/users/me')
      .then(res => {
        const { id, email, nickname, role, profileImageUrl } = res.data.data;
        setUser({ id, email, nickname, role, profileImageUrl });
        router.replace('/');
      })
      .catch(() => {
        router.replace('/login?error=oauth_failed');
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f6f8]">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-[#003478] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm">로그인 중...</p>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense>
      <OAuthCallback />
    </Suspense>
  );
}
```

- [ ] **Step 4: `/api/v1/users/me` 엔드포인트 확인**

`UserController` 또는 `AuthController`에 `/api/v1/users/me` 엔드포인트가 있는지 확인:

```bash
grep -r "users/me\|/me" backend/src/main/java --include="*.java" -l
```

있으면 OK. 없으면 `AuthController.java`에 추가:

```java
@Operation(summary = "내 정보 조회")
@GetMapping("/me")
public ResponseEntity<ApiResponse<AuthDto.UserInfoResponse>> me(
        @AuthenticationPrincipal CustomUserDetails userDetails) {
    User user = userRepository.findById(userDetails.getUserId())
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    return ResponseEntity.ok(ApiResponse.success(AuthDto.UserInfoResponse.from(user)));
}
```

`AuthDto.java`에 `UserInfoResponse` 추가:
```java
@Getter
@Builder
public static class UserInfoResponse {
    private Long id;
    private String email;
    private String nickname;
    private String role;
    private String profileImageUrl;

    public static UserInfoResponse from(User user) {
        return UserInfoResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .role(user.getRole().name())
                .profileImageUrl(user.getProfileImageUrl())
                .build();
    }
}
```

- [ ] **Step 5: 프론트 빌드 확인**

```bash
cd frontend
npm run build
```

Expected: 빌드 성공 (타입 에러 없음)

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/\(site\)/login/page.tsx \
        frontend/src/app/auth/callback/page.tsx
git commit -m "feat: add Google/Kakao social login buttons and OAuth callback page"
```

---

## 배포 전 필수 작업 (코드 구현 완료 후)

### Google OAuth2 App 등록 (Google Cloud Console)
1. [console.cloud.google.com](https://console.cloud.google.com) → API 및 서비스 → 사용자 인증 정보
2. OAuth 2.0 클라이언트 ID 생성 (웹 애플리케이션)
3. 승인된 리디렉션 URI: `https://churchhub-backend.fly.dev/login/oauth2/code/google`
4. Client ID, Client Secret 복사

### Kakao OAuth2 App 등록 (Kakao Developers)
1. [developers.kakao.com](https://developers.kakao.com) → 내 애플리케이션 → 앱 추가
2. 플랫폼 → Web → 사이트 도메인: `https://churchhub-backend.fly.dev`
3. Redirect URI: `https://churchhub-backend.fly.dev/login/oauth2/code/kakao`
4. 카카오 로그인 활성화, 동의항목: `profile_nickname`, `account_email` 선택
5. 앱 키(REST API 키) = Client ID, 보안 → Client Secret 생성

### Fly.io Secrets 설정
```bash
fly secrets set \
  GOOGLE_CLIENT_ID=your_google_client_id \
  GOOGLE_CLIENT_SECRET=your_google_client_secret \
  KAKAO_CLIENT_ID=your_kakao_rest_api_key \
  KAKAO_CLIENT_SECRET=your_kakao_client_secret \
  OAUTH2_REDIRECT_URL=https://church-community-zeta.vercel.app/auth/callback \
  --app churchhub-backend
```

### Vercel 환경변수 설정
```
NEXT_PUBLIC_API_URL=https://churchhub-backend.fly.dev
```

### 배포
```bash
# backend 디렉토리에서
fly deploy --app churchhub-backend
```

---

## Self-Review

**Spec coverage 체크:**
- ✅ Google OAuth2 로그인
- ✅ Kakao OAuth2 로그인
- ✅ Refresh token (기존 구현 유지, rotation 이미 됨)
- ✅ Access token 블랙리스트 (로그아웃 시 즉시 무효화)
- ✅ 프론트 소셜 로그인 버튼 + 콜백 처리

**스킵한 것:**
- httpOnly 쿠키로 refresh token 이동 — XSS 추가 방어. 현재 localStorage 방식이 동작하고 있으므로 필요 시 별도 작업
- 닉네임 프로필 설정 페이지 (OAuth 신규 가입자가 닉네임 커스터마이징 원할 때) — 현재 자동 생성으로 충분

**Type consistency:**
- `User.fromOAuth(String, String, String, String, String)` — Task 1에서 정의, Task 3 `CustomOAuth2UserService.createOAuthUser()`에서 사용 ✅
- `jwtTokenProvider.getRemainingExpiryMs(token)` — Task 4 Step 1에서 정의, `AuthService.logout()`에서 사용 ✅
- `authService.logout(Long, String)` — Task 4 Step 3에서 시그니처 변경, Task 4 Step 4 `AuthController`에서 호출 ✅
- `UserRepository.findByProviderAndProviderId(String, String)` — Task 3 Step 5에서 추가, `CustomOAuth2UserService`에서 사용 ✅
