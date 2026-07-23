# Plan 1: Foundation — 역할 확장 + 교회 도메인

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** UserRole에 CHURCH_MANAGER·PASTOR를 추가하고, 교회(Church) 도메인을 구축한다.

**Architecture:** 기존 ADMIN role을 CHURCH_MANAGER로 rename하고 PASTOR를 신규 추가한다. DB는 UPDATE로 마이그레이션. Church 엔티티를 신규 도메인으로 추가하고 CHURCH_MANAGER가 자기 교회만 관리하도록 권한 설정한다.

**Tech Stack:** Spring Boot 3.2.5, JPA/Hibernate, PostgreSQL, Spring Security 6 (`@PreAuthorize`)

## Global Constraints

- 패키지 루트: `com.churchhub`
- 빌드: `JAVA_HOME="/c/Users/taeyeop/.jdks/graalvm-jdk-21.0.7" ./gradlew bootRun`
- 응답 wrapper: `ApiResponse.success(data)` / `ApiResponse.error(message)`
- 엔티티 패턴: `@Builder`, `@Getter`, `@NoArgsConstructor(access = AccessLevel.PROTECTED)`, `@EntityListeners(AuditingEntityListener.class)`
- 에러: `throw new BusinessException(ErrorCode.XXX)`
- API prefix: `/api/v1/`

---

## Task 1: UserRole 확장 + SecurityConfig 업데이트

**Files:**
- Modify: `backend/src/main/java/com/churchhub/domain/user/entity/UserRole.java`
- Modify: `backend/src/main/java/com/churchhub/config/SecurityConfig.java`
- Modify: `backend/src/main/java/com/churchhub/domain/user/dto/UserDto.java` (Response의 role 필드)
- Create: `backend/src/main/resources/db/migration/V2__rename_admin_role.sql` (Flyway 미사용 시 수동 실행)

**Interfaces:**
- Produces: `UserRole.CHURCH_MANAGER`, `UserRole.PASTOR` — 이후 모든 Task가 이 값을 사용

- [ ] **Step 1: UserRole enum 수정**

`UserRole.java`를 아래로 교체:
```java
package com.churchhub.domain.user.entity;

public enum UserRole {
    USER, CHURCH_MANAGER, PASTOR, SUPER_ADMIN
}
```

- [ ] **Step 2: DB 마이그레이션 스크립트 작성**

`backend/src/main/resources/db/migration/V2__rename_admin_role.sql` 생성:
```sql
UPDATE users SET role = 'CHURCH_MANAGER' WHERE role = 'ADMIN';
```
> Flyway 미사용 시: 로컬 + Supabase DB에 직접 실행

- [ ] **Step 3: SecurityConfig 권한 규칙 업데이트**

`SecurityConfig.java`의 `authorizeHttpRequests` 블록 수정:
```java
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/v1/auth/**").permitAll()
    .requestMatchers(HttpMethod.GET, "/api/v1/posts/**").permitAll()
    .requestMatchers(HttpMethod.GET, "/api/v1/categories/**").permitAll()
    .requestMatchers(HttpMethod.GET, "/api/v1/events/**").permitAll()
    .requestMatchers(HttpMethod.GET, "/api/v1/comments/**").permitAll()
    .requestMatchers(HttpMethod.GET, "/api/v1/churches/**").permitAll()
    .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/api-docs/**", "/webjars/**").permitAll()
    .requestMatchers("/actuator/health").permitAll()
    .requestMatchers("/api/v1/admin/**").hasAnyRole("CHURCH_MANAGER", "SUPER_ADMIN")
    .anyRequest().authenticated()
)
```

- [ ] **Step 4: 빌드 확인**

```bash
cd backend
JAVA_HOME="/c/Users/taeyeop/.jdks/graalvm-jdk-21.0.7" ./gradlew compileJava
```
Expected: BUILD SUCCESSFUL (컴파일 에러 없음)

- [ ] **Step 5: DB 마이그레이션 실행**

Supabase SQL Editor에서 실행:
```sql
UPDATE users SET role = 'CHURCH_MANAGER' WHERE role = 'ADMIN';
SELECT role, COUNT(*) FROM users GROUP BY role;
```
Expected: ADMIN 0건, CHURCH_MANAGER N건

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/com/churchhub/domain/user/entity/UserRole.java \
        backend/src/main/java/com/churchhub/config/SecurityConfig.java \
        backend/src/main/resources/db/migration/V2__rename_admin_role.sql
git commit -m "feat: UserRole CHURCH_MANAGER·PASTOR 추가, ADMIN→CHURCH_MANAGER rename"
```

---

## Task 2: Church 도메인 (백엔드)

**Files:**
- Create: `backend/src/main/java/com/churchhub/domain/church/entity/Church.java`
- Create: `backend/src/main/java/com/churchhub/domain/church/dto/ChurchDto.java`
- Create: `backend/src/main/java/com/churchhub/domain/church/repository/ChurchRepository.java`
- Create: `backend/src/main/java/com/churchhub/domain/church/service/ChurchService.java`
- Create: `backend/src/main/java/com/churchhub/domain/church/api/ChurchController.java`
- Modify: `backend/src/main/java/com/churchhub/exception/ErrorCode.java` (CHURCH_NOT_FOUND 추가)
- Modify: `backend/src/main/java/com/churchhub/domain/user/entity/User.java` (church 연관관계 추가)

**Interfaces:**
- Consumes: `UserRole.CHURCH_MANAGER` (Task 1)
- Produces:
  - `GET /api/v1/churches` → `List<ChurchDto.Response>` (공개)
  - `GET /api/v1/churches/{id}` → `ChurchDto.Response` (공개)
  - `POST /api/v1/admin/churches` → `ChurchDto.Response` (SUPER_ADMIN만)
  - `PUT /api/v1/admin/churches/{id}` → `ChurchDto.Response` (SUPER_ADMIN or 담당 CHURCH_MANAGER)
  - `DELETE /api/v1/admin/churches/{id}` (SUPER_ADMIN만)

- [ ] **Step 1: Church 엔티티 생성**

`Church.java`:
```java
package com.churchhub.domain.church.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "churches")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Church {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 200)
    private String address;

    @Column(length = 200)
    private String sundayServiceTime;

    private boolean hasYouthGroup = false;

    @Column(length = 100)
    private String contactInfo;

    @Column(length = 200)
    private String introduction;

    @Column(length = 200)
    private String websiteUrl;

    @Column(length = 200)
    private String instagramUrl;

    private boolean visible = true;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Builder
    public Church(String name, String address, String sundayServiceTime,
                  boolean hasYouthGroup, String contactInfo, String introduction,
                  String websiteUrl, String instagramUrl) {
        this.name = name;
        this.address = address;
        this.sundayServiceTime = sundayServiceTime;
        this.hasYouthGroup = hasYouthGroup;
        this.contactInfo = contactInfo;
        this.introduction = introduction;
        this.websiteUrl = websiteUrl;
        this.instagramUrl = instagramUrl;
    }

    public void update(String name, String address, String sundayServiceTime,
                       boolean hasYouthGroup, String contactInfo, String introduction,
                       String websiteUrl, String instagramUrl, boolean visible) {
        this.name = name;
        this.address = address;
        this.sundayServiceTime = sundayServiceTime;
        this.hasYouthGroup = hasYouthGroup;
        this.contactInfo = contactInfo;
        this.introduction = introduction;
        this.websiteUrl = websiteUrl;
        this.instagramUrl = instagramUrl;
        this.visible = visible;
    }
}
```

- [ ] **Step 2: User 엔티티에 church 연관관계 추가**

`User.java`의 필드 영역에 추가:
```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "church_id")
private Church church;

public void assignChurch(Church church) {
    this.church = church;
}
```

- [ ] **Step 3: ErrorCode에 CHURCH_NOT_FOUND 추가**

`ErrorCode.java`에 추가:
```java
CHURCH_NOT_FOUND(404, "교회를 찾을 수 없습니다."),
```

- [ ] **Step 4: ChurchDto 생성**

`ChurchDto.java`:
```java
package com.churchhub.domain.church.dto;

import com.churchhub.domain.church.entity.Church;
import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

public class ChurchDto {

    @Getter
    public static class CreateRequest {
        @NotBlank private String name;
        @NotBlank private String address;
        private String sundayServiceTime;
        private boolean hasYouthGroup;
        private String contactInfo;
        private String introduction;
        private String websiteUrl;
        private String instagramUrl;
    }

    @Getter
    public static class UpdateRequest {
        @NotBlank private String name;
        @NotBlank private String address;
        private String sundayServiceTime;
        private boolean hasYouthGroup;
        private String contactInfo;
        private String introduction;
        private String websiteUrl;
        private String instagramUrl;
        private boolean visible;
    }

    @Getter
    @Builder
    public static class Response {
        private Long id;
        private String name;
        private String address;
        private String sundayServiceTime;
        private boolean hasYouthGroup;
        private String contactInfo;
        private String introduction;
        private String websiteUrl;
        private String instagramUrl;
        private boolean visible;
        private LocalDateTime createdAt;

        public static Response from(Church church) {
            return Response.builder()
                    .id(church.getId())
                    .name(church.getName())
                    .address(church.getAddress())
                    .sundayServiceTime(church.getSundayServiceTime())
                    .hasYouthGroup(church.isHasYouthGroup())
                    .contactInfo(church.getContactInfo())
                    .introduction(church.getIntroduction())
                    .websiteUrl(church.getWebsiteUrl())
                    .instagramUrl(church.getInstagramUrl())
                    .visible(church.isVisible())
                    .createdAt(church.getCreatedAt())
                    .build();
        }
    }
}
```

- [ ] **Step 5: ChurchRepository 생성**

`ChurchRepository.java`:
```java
package com.churchhub.domain.church.repository;

import com.churchhub.domain.church.entity.Church;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChurchRepository extends JpaRepository<Church, Long> {
    List<Church> findAllByVisibleTrueOrderByNameAsc();
}
```

- [ ] **Step 6: ChurchService 생성**

`ChurchService.java`:
```java
package com.churchhub.domain.church.service;

import com.churchhub.domain.church.dto.ChurchDto;
import com.churchhub.domain.church.entity.Church;
import com.churchhub.domain.church.repository.ChurchRepository;
import com.churchhub.exception.BusinessException;
import com.churchhub.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChurchService {

    private final ChurchRepository churchRepository;

    public List<ChurchDto.Response> getChurches() {
        return churchRepository.findAllByVisibleTrueOrderByNameAsc()
                .stream().map(ChurchDto.Response::from).toList();
    }

    public ChurchDto.Response getChurch(Long id) {
        Church church = churchRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHURCH_NOT_FOUND));
        return ChurchDto.Response.from(church);
    }

    @Transactional
    public ChurchDto.Response createChurch(ChurchDto.CreateRequest req) {
        Church church = Church.builder()
                .name(req.getName())
                .address(req.getAddress())
                .sundayServiceTime(req.getSundayServiceTime())
                .hasYouthGroup(req.isHasYouthGroup())
                .contactInfo(req.getContactInfo())
                .introduction(req.getIntroduction())
                .websiteUrl(req.getWebsiteUrl())
                .instagramUrl(req.getInstagramUrl())
                .build();
        return ChurchDto.Response.from(churchRepository.save(church));
    }

    @Transactional
    public ChurchDto.Response updateChurch(Long id, ChurchDto.UpdateRequest req) {
        Church church = churchRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHURCH_NOT_FOUND));
        church.update(req.getName(), req.getAddress(), req.getSundayServiceTime(),
                req.isHasYouthGroup(), req.getContactInfo(), req.getIntroduction(),
                req.getWebsiteUrl(), req.getInstagramUrl(), req.isVisible());
        return ChurchDto.Response.from(church);
    }

    @Transactional
    public void deleteChurch(Long id) {
        if (!churchRepository.existsById(id)) {
            throw new BusinessException(ErrorCode.CHURCH_NOT_FOUND);
        }
        churchRepository.deleteById(id);
    }
}
```

- [ ] **Step 7: ChurchController 생성**

`ChurchController.java`:
```java
package com.churchhub.domain.church.api;

import com.churchhub.common.response.ApiResponse;
import com.churchhub.domain.church.dto.ChurchDto;
import com.churchhub.domain.church.service.ChurchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ChurchController {

    private final ChurchService churchService;

    @GetMapping("/churches")
    public ApiResponse<List<ChurchDto.Response>> getChurches() {
        return ApiResponse.success(churchService.getChurches());
    }

    @GetMapping("/churches/{id}")
    public ApiResponse<ChurchDto.Response> getChurch(@PathVariable Long id) {
        return ApiResponse.success(churchService.getChurch(id));
    }

    @PostMapping("/admin/churches")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<ChurchDto.Response> createChurch(@Valid @RequestBody ChurchDto.CreateRequest req) {
        return ApiResponse.success(churchService.createChurch(req));
    }

    @PutMapping("/admin/churches/{id}")
    @PreAuthorize("hasAnyRole('CHURCH_MANAGER', 'SUPER_ADMIN')")
    public ApiResponse<ChurchDto.Response> updateChurch(@PathVariable Long id,
                                                         @Valid @RequestBody ChurchDto.UpdateRequest req) {
        return ApiResponse.success(churchService.updateChurch(id, req));
    }

    @DeleteMapping("/admin/churches/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ApiResponse<Void> deleteChurch(@PathVariable Long id) {
        churchService.deleteChurch(id);
        return ApiResponse.success(null);
    }
}
```

- [ ] **Step 8: 빌드 + 로컬 서버 실행 확인**

```bash
cd backend
JAVA_HOME="/c/Users/taeyeop/.jdks/graalvm-jdk-21.0.7" ./gradlew bootRun
```
Expected: Started ChurchHubApplication

- [ ] **Step 9: API 동작 확인**

```bash
# 교회 목록 (공개)
curl http://localhost:8080/api/v1/churches

# 교회 생성 (SUPER_ADMIN 토큰 필요)
curl -X POST http://localhost:8080/api/v1/admin/churches \
  -H "Authorization: Bearer {SUPER_ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"name":"신촌교회","address":"서울 마포구 염리동","sundayServiceTime":"오전 11시","hasYouthGroup":true,"introduction":"염리동 대표 교회"}'
```

Expected: 200 OK, church 데이터 반환

- [ ] **Step 10: Commit**

```bash
git add backend/src/main/java/com/churchhub/domain/church/ \
        backend/src/main/java/com/churchhub/domain/user/entity/User.java \
        backend/src/main/java/com/churchhub/exception/ErrorCode.java
git commit -m "feat: Church 도메인 추가 (교회 소개 CRUD)"
```
