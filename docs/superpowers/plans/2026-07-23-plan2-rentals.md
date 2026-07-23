# Plan 2: Rental Systems — 공간 대여 + 물품 대여

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 공간(Space) 대여 및 물품(Item) 대여 시스템을 구축한다. 신청 → 담당자 승인 → 알림 흐름.

**Architecture:** Space/Item 목록은 공개 열람, 신청은 로그인 필요, 승인은 CHURCH_MANAGER 이상. 승인/거절 시 NotificationService로 신청자에게 알림.

**Tech Stack:** Spring Boot 3.2.5, JPA, Spring Security 6

## Global Constraints

- 패키지 루트: `com.churchhub`
- 빌드: `JAVA_HOME="/c/Users/taeyeop/.jdks/graalvm-jdk-21.0.7" ./gradlew bootRun`
- 응답 wrapper: `ApiResponse.success(data)`
- 엔티티 패턴: `@Builder`, `@Getter`, `@NoArgsConstructor(access = AccessLevel.PROTECTED)`, `@EntityListeners(AuditingEntityListener.class)`
- 에러: `throw new BusinessException(ErrorCode.XXX)`
- **Plan 1 완료 후 실행** (UserRole.CHURCH_MANAGER 필요)

---

## Task 1: Space 도메인 (공간 대여)

**Files:**
- Create: `backend/src/main/java/com/churchhub/domain/space/entity/Space.java`
- Create: `backend/src/main/java/com/churchhub/domain/space/entity/SpaceRental.java`
- Create: `backend/src/main/java/com/churchhub/domain/space/entity/RentalStatus.java`
- Create: `backend/src/main/java/com/churchhub/domain/space/dto/SpaceDto.java`
- Create: `backend/src/main/java/com/churchhub/domain/space/repository/SpaceRepository.java`
- Create: `backend/src/main/java/com/churchhub/domain/space/repository/SpaceRentalRepository.java`
- Create: `backend/src/main/java/com/churchhub/domain/space/service/SpaceService.java`
- Create: `backend/src/main/java/com/churchhub/domain/space/api/SpaceController.java`
- Modify: `backend/src/main/java/com/churchhub/exception/ErrorCode.java`

**Interfaces:**
- Consumes: `Church` (Plan 1 Task 2), `NotificationService.send()`, `UserRole.CHURCH_MANAGER`
- Produces:
  - `GET /api/v1/spaces` → `List<SpaceDto.Response>` (공개)
  - `POST /api/v1/spaces/{id}/rentals` → `SpaceDto.RentalResponse` (로그인)
  - `PUT /api/v1/admin/spaces/rentals/{rentalId}/approve` (CHURCH_MANAGER)
  - `PUT /api/v1/admin/spaces/rentals/{rentalId}/reject` (CHURCH_MANAGER)

- [ ] **Step 1: RentalStatus enum 생성**

`RentalStatus.java`:
```java
package com.churchhub.domain.space.entity;

public enum RentalStatus {
    PENDING, APPROVED, REJECTED, CANCELLED
}
```

- [ ] **Step 2: Space 엔티티 생성**

`Space.java`:
```java
package com.churchhub.domain.space.entity;

import com.churchhub.domain.church.entity.Church;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "spaces")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Space {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "church_id")
    private Church church;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 200)
    private String description;

    @Column(length = 200)
    private String usageTypes;

    private Integer capacity;

    private boolean available = true;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Builder
    public Space(Church church, String name, String description, String usageTypes, Integer capacity) {
        this.church = church;
        this.name = name;
        this.description = description;
        this.usageTypes = usageTypes;
        this.capacity = capacity;
    }

    public void update(String name, String description, String usageTypes, Integer capacity, boolean available) {
        this.name = name;
        this.description = description;
        this.usageTypes = usageTypes;
        this.capacity = capacity;
        this.available = available;
    }
}
```

- [ ] **Step 3: SpaceRental 엔티티 생성**

`SpaceRental.java`:
```java
package com.churchhub.domain.space.entity;

import com.churchhub.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "space_rentals")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class SpaceRental {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "space_id", nullable = false)
    private Space space;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User applicant;

    @Column(nullable = false)
    private LocalDateTime startDateTime;

    @Column(nullable = false)
    private LocalDateTime endDateTime;

    private Integer headcount;

    @Column(length = 300)
    private String purpose;

    @Column(length = 100)
    private String contactPhone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RentalStatus status = RentalStatus.PENDING;

    @Column(length = 300)
    private String rejectReason;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public SpaceRental(Space space, User applicant, LocalDateTime startDateTime,
                       LocalDateTime endDateTime, Integer headcount, String purpose, String contactPhone) {
        this.space = space;
        this.applicant = applicant;
        this.startDateTime = startDateTime;
        this.endDateTime = endDateTime;
        this.headcount = headcount;
        this.purpose = purpose;
        this.contactPhone = contactPhone;
    }

    public void approve() { this.status = RentalStatus.APPROVED; }
    public void reject(String reason) {
        this.status = RentalStatus.REJECTED;
        this.rejectReason = reason;
    }
}
```

- [ ] **Step 4: ErrorCode에 추가**

`ErrorCode.java`에 추가:
```java
SPACE_NOT_FOUND(404, "공간을 찾을 수 없습니다."),
SPACE_RENTAL_NOT_FOUND(404, "대여 신청을 찾을 수 없습니다."),
SPACE_NOT_AVAILABLE(400, "현재 대여 불가능한 공간입니다."),
```

- [ ] **Step 5: SpaceDto 생성**

`SpaceDto.java`:
```java
package com.churchhub.domain.space.dto;

import com.churchhub.domain.space.entity.RentalStatus;
import com.churchhub.domain.space.entity.Space;
import com.churchhub.domain.space.entity.SpaceRental;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

public class SpaceDto {

    @Getter
    public static class CreateRequest {
        @NotNull private Long churchId;
        @NotBlank private String name;
        private String description;
        private String usageTypes;
        private Integer capacity;
    }

    @Getter
    public static class RentalRequest {
        @NotNull private LocalDateTime startDateTime;
        @NotNull private LocalDateTime endDateTime;
        private Integer headcount;
        @NotBlank private String purpose;
        @NotBlank private String contactPhone;
    }

    @Getter
    public static class RejectRequest {
        private String reason;
    }

    @Getter
    @Builder
    public static class Response {
        private Long id;
        private String churchName;
        private String name;
        private String description;
        private String usageTypes;
        private Integer capacity;
        private boolean available;

        public static Response from(Space s) {
            return Response.builder()
                    .id(s.getId())
                    .churchName(s.getChurch() != null ? s.getChurch().getName() : null)
                    .name(s.getName())
                    .description(s.getDescription())
                    .usageTypes(s.getUsageTypes())
                    .capacity(s.getCapacity())
                    .available(s.isAvailable())
                    .build();
        }
    }

    @Getter
    @Builder
    public static class RentalResponse {
        private Long id;
        private Long spaceId;
        private String spaceName;
        private String applicantNickname;
        private LocalDateTime startDateTime;
        private LocalDateTime endDateTime;
        private Integer headcount;
        private String purpose;
        private String contactPhone;
        private RentalStatus status;
        private String rejectReason;
        private LocalDateTime createdAt;

        public static RentalResponse from(SpaceRental r) {
            return RentalResponse.builder()
                    .id(r.getId())
                    .spaceId(r.getSpace().getId())
                    .spaceName(r.getSpace().getName())
                    .applicantNickname(r.getApplicant().getNickname())
                    .startDateTime(r.getStartDateTime())
                    .endDateTime(r.getEndDateTime())
                    .headcount(r.getHeadcount())
                    .purpose(r.getPurpose())
                    .contactPhone(r.getContactPhone())
                    .status(r.getStatus())
                    .rejectReason(r.getRejectReason())
                    .createdAt(r.getCreatedAt())
                    .build();
        }
    }
}
```

- [ ] **Step 6: Repository 생성**

`SpaceRepository.java`:
```java
package com.churchhub.domain.space.repository;

import com.churchhub.domain.space.entity.Space;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SpaceRepository extends JpaRepository<Space, Long> {
    List<Space> findAllByOrderByCreatedAtDesc();
}
```

`SpaceRentalRepository.java`:
```java
package com.churchhub.domain.space.repository;

import com.churchhub.domain.space.entity.SpaceRental;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SpaceRentalRepository extends JpaRepository<SpaceRental, Long> {
    List<SpaceRental> findAllByOrderByCreatedAtDesc();
    List<SpaceRental> findAllByApplicantIdOrderByCreatedAtDesc(Long userId);
}
```

- [ ] **Step 7: SpaceService 생성**

`SpaceService.java`:
```java
package com.churchhub.domain.space.service;

import com.churchhub.domain.church.entity.Church;
import com.churchhub.domain.church.repository.ChurchRepository;
import com.churchhub.domain.notification.entity.NotificationType;
import com.churchhub.domain.notification.entity.RelatedType;
import com.churchhub.domain.notification.service.NotificationService;
import com.churchhub.domain.space.dto.SpaceDto;
import com.churchhub.domain.space.entity.Space;
import com.churchhub.domain.space.entity.SpaceRental;
import com.churchhub.domain.space.repository.SpaceRentalRepository;
import com.churchhub.domain.space.repository.SpaceRepository;
import com.churchhub.domain.user.entity.User;
import com.churchhub.domain.user.repository.UserRepository;
import com.churchhub.exception.BusinessException;
import com.churchhub.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SpaceService {

    private final SpaceRepository spaceRepository;
    private final SpaceRentalRepository spaceRentalRepository;
    private final ChurchRepository churchRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public List<SpaceDto.Response> getSpaces() {
        return spaceRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(SpaceDto.Response::from).toList();
    }

    public List<SpaceDto.RentalResponse> getAllRentals() {
        return spaceRentalRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(SpaceDto.RentalResponse::from).toList();
    }

    public List<SpaceDto.RentalResponse> getMyRentals(Long userId) {
        return spaceRentalRepository.findAllByApplicantIdOrderByCreatedAtDesc(userId)
                .stream().map(SpaceDto.RentalResponse::from).toList();
    }

    @Transactional
    public SpaceDto.Response createSpace(SpaceDto.CreateRequest req) {
        Church church = churchRepository.findById(req.getChurchId())
                .orElseThrow(() -> new BusinessException(ErrorCode.CHURCH_NOT_FOUND));
        Space space = Space.builder()
                .church(church).name(req.getName()).description(req.getDescription())
                .usageTypes(req.getUsageTypes()).capacity(req.getCapacity()).build();
        return SpaceDto.Response.from(spaceRepository.save(space));
    }

    @Transactional
    public SpaceDto.RentalResponse applyRental(Long spaceId, Long userId, SpaceDto.RentalRequest req) {
        Space space = spaceRepository.findById(spaceId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SPACE_NOT_FOUND));
        if (!space.isAvailable()) throw new BusinessException(ErrorCode.SPACE_NOT_AVAILABLE);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        SpaceRental rental = SpaceRental.builder()
                .space(space).applicant(user)
                .startDateTime(req.getStartDateTime()).endDateTime(req.getEndDateTime())
                .headcount(req.getHeadcount()).purpose(req.getPurpose())
                .contactPhone(req.getContactPhone()).build();
        return SpaceDto.RentalResponse.from(spaceRentalRepository.save(rental));
    }

    @Transactional
    public SpaceDto.RentalResponse approveRental(Long rentalId) {
        SpaceRental rental = spaceRentalRepository.findById(rentalId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SPACE_RENTAL_NOT_FOUND));
        rental.approve();
        notificationService.send(rental.getApplicant(), NotificationType.NOTICE,
                "공간 대여 신청이 승인되었습니다: " + rental.getSpace().getName(),
                RelatedType.POST, rentalId);
        return SpaceDto.RentalResponse.from(rental);
    }

    @Transactional
    public SpaceDto.RentalResponse rejectRental(Long rentalId, String reason) {
        SpaceRental rental = spaceRentalRepository.findById(rentalId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SPACE_RENTAL_NOT_FOUND));
        rental.reject(reason);
        notificationService.send(rental.getApplicant(), NotificationType.NOTICE,
                "공간 대여 신청이 거절되었습니다: " + rental.getSpace().getName(),
                RelatedType.POST, rentalId);
        return SpaceDto.RentalResponse.from(rental);
    }
}
```

- [ ] **Step 8: SpaceController 생성**

`SpaceController.java`:
```java
package com.churchhub.domain.space.api;

import com.churchhub.common.response.ApiResponse;
import com.churchhub.domain.space.dto.SpaceDto;
import com.churchhub.domain.space.service.SpaceService;
import com.churchhub.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class SpaceController {

    private final SpaceService spaceService;

    @GetMapping("/spaces")
    public ApiResponse<List<SpaceDto.Response>> getSpaces() {
        return ApiResponse.success(spaceService.getSpaces());
    }

    @PostMapping("/spaces/{id}/rentals")
    public ApiResponse<SpaceDto.RentalResponse> applyRental(
            @PathVariable Long id,
            @Valid @RequestBody SpaceDto.RentalRequest req,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(spaceService.applyRental(id, userDetails.getUserId(), req));
    }

    @GetMapping("/spaces/rentals/my")
    public ApiResponse<List<SpaceDto.RentalResponse>> getMyRentals(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(spaceService.getMyRentals(userDetails.getUserId()));
    }

    @PostMapping("/admin/spaces")
    @PreAuthorize("hasAnyRole('CHURCH_MANAGER', 'SUPER_ADMIN')")
    public ApiResponse<SpaceDto.Response> createSpace(@Valid @RequestBody SpaceDto.CreateRequest req) {
        return ApiResponse.success(spaceService.createSpace(req));
    }

    @GetMapping("/admin/spaces/rentals")
    @PreAuthorize("hasAnyRole('CHURCH_MANAGER', 'SUPER_ADMIN')")
    public ApiResponse<List<SpaceDto.RentalResponse>> getAllRentals() {
        return ApiResponse.success(spaceService.getAllRentals());
    }

    @PutMapping("/admin/spaces/rentals/{rentalId}/approve")
    @PreAuthorize("hasAnyRole('CHURCH_MANAGER', 'SUPER_ADMIN')")
    public ApiResponse<SpaceDto.RentalResponse> approveRental(@PathVariable Long rentalId) {
        return ApiResponse.success(spaceService.approveRental(rentalId));
    }

    @PutMapping("/admin/spaces/rentals/{rentalId}/reject")
    @PreAuthorize("hasAnyRole('CHURCH_MANAGER', 'SUPER_ADMIN')")
    public ApiResponse<SpaceDto.RentalResponse> rejectRental(
            @PathVariable Long rentalId,
            @RequestBody SpaceDto.RejectRequest req) {
        return ApiResponse.success(spaceService.rejectRental(rentalId, req.getReason()));
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
git add backend/src/main/java/com/churchhub/domain/space/
git commit -m "feat: Space 도메인 추가 (공간 대여 신청·승인·거절)"
```

---

## Task 2: Item 도메인 (물품 대여)

**Files:**
- Create: `backend/src/main/java/com/churchhub/domain/item/entity/Item.java`
- Create: `backend/src/main/java/com/churchhub/domain/item/entity/ItemCategory.java`
- Create: `backend/src/main/java/com/churchhub/domain/item/entity/ItemRental.java`
- Create: `backend/src/main/java/com/churchhub/domain/item/dto/ItemDto.java`
- Create: `backend/src/main/java/com/churchhub/domain/item/repository/ItemRepository.java`
- Create: `backend/src/main/java/com/churchhub/domain/item/repository/ItemRentalRepository.java`
- Create: `backend/src/main/java/com/churchhub/domain/item/service/ItemService.java`
- Create: `backend/src/main/java/com/churchhub/domain/item/api/ItemController.java`
- Modify: `backend/src/main/java/com/churchhub/exception/ErrorCode.java`

**Interfaces:**
- Consumes: `RentalStatus` (Task 1 — `com.churchhub.domain.space.entity.RentalStatus` 재사용)
- Produces:
  - `GET /api/v1/items` → `List<ItemDto.Response>` (공개)
  - `POST /api/v1/items/{id}/rentals` → `ItemDto.RentalResponse` (로그인)
  - `PUT /api/v1/admin/items/rentals/{rentalId}/approve` (CHURCH_MANAGER)
  - `PUT /api/v1/admin/items/rentals/{rentalId}/reject` (CHURCH_MANAGER)

- [ ] **Step 1: ItemCategory enum 생성**

`ItemCategory.java`:
```java
package com.churchhub.domain.item.entity;

public enum ItemCategory {
    MOVING,    // 이사/정리
    CLEANING,  // 청소
    LIVING,    // 생활
    EVENT      // 행사
}
```

- [ ] **Step 2: Item 엔티티 생성**

`Item.java`:
```java
package com.churchhub.domain.item.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "items")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 300)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ItemCategory category;

    private int totalQuantity = 1;
    private int availableQuantity = 1;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Builder
    public Item(String name, String description, ItemCategory category, int totalQuantity) {
        this.name = name;
        this.description = description;
        this.category = category;
        this.totalQuantity = totalQuantity;
        this.availableQuantity = totalQuantity;
    }

    public void update(String name, String description, ItemCategory category, int totalQuantity) {
        this.name = name;
        this.description = description;
        this.category = category;
        this.totalQuantity = totalQuantity;
    }

    public boolean hasStock(int qty) { return availableQuantity >= qty; }
    public void decreaseStock(int qty) { this.availableQuantity -= qty; }
    public void increaseStock(int qty) { this.availableQuantity += qty; }
}
```

- [ ] **Step 3: ItemRental 엔티티 생성**

`ItemRental.java`:
```java
package com.churchhub.domain.item.entity;

import com.churchhub.domain.space.entity.RentalStatus;
import com.churchhub.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "item_rentals")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class ItemRental {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User applicant;

    private int quantity = 1;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Column(length = 100)
    private String contactPhone;

    @Column(length = 300)
    private String purpose;

    private boolean termsAgreed = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RentalStatus status = RentalStatus.PENDING;

    @Column(length = 300)
    private String rejectReason;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public ItemRental(Item item, User applicant, int quantity, LocalDate startDate,
                      LocalDate endDate, String contactPhone, String purpose, boolean termsAgreed) {
        this.item = item;
        this.applicant = applicant;
        this.quantity = quantity;
        this.startDate = startDate;
        this.endDate = endDate;
        this.contactPhone = contactPhone;
        this.purpose = purpose;
        this.termsAgreed = termsAgreed;
    }

    public void approve() { this.status = RentalStatus.APPROVED; }
    public void reject(String reason) {
        this.status = RentalStatus.REJECTED;
        this.rejectReason = reason;
    }
}
```

- [ ] **Step 4: ErrorCode에 추가**

```java
ITEM_NOT_FOUND(404, "물품을 찾을 수 없습니다."),
ITEM_RENTAL_NOT_FOUND(404, "물품 대여 신청을 찾을 수 없습니다."),
ITEM_OUT_OF_STOCK(400, "재고가 부족합니다."),
ITEM_TERMS_NOT_AGREED(400, "약관에 동의해야 합니다."),
```

- [ ] **Step 5: ItemDto 생성**

`ItemDto.java`:
```java
package com.churchhub.domain.item.dto;

import com.churchhub.domain.item.entity.Item;
import com.churchhub.domain.item.entity.ItemCategory;
import com.churchhub.domain.item.entity.ItemRental;
import com.churchhub.domain.space.entity.RentalStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class ItemDto {

    @Getter
    public static class CreateRequest {
        @NotBlank private String name;
        private String description;
        @NotNull private ItemCategory category;
        private int totalQuantity = 1;
    }

    @Getter
    public static class RentalRequest {
        private int quantity = 1;
        @NotNull private LocalDate startDate;
        @NotNull private LocalDate endDate;
        @NotBlank private String contactPhone;
        private String purpose;
        private boolean termsAgreed;
    }

    @Getter
    public static class RejectRequest {
        private String reason;
    }

    @Getter
    @Builder
    public static class Response {
        private Long id;
        private String name;
        private String description;
        private ItemCategory category;
        private int totalQuantity;
        private int availableQuantity;

        public static Response from(Item i) {
            return Response.builder()
                    .id(i.getId()).name(i.getName()).description(i.getDescription())
                    .category(i.getCategory()).totalQuantity(i.getTotalQuantity())
                    .availableQuantity(i.getAvailableQuantity()).build();
        }
    }

    @Getter
    @Builder
    public static class RentalResponse {
        private Long id;
        private Long itemId;
        private String itemName;
        private ItemCategory itemCategory;
        private String applicantNickname;
        private int quantity;
        private LocalDate startDate;
        private LocalDate endDate;
        private String contactPhone;
        private String purpose;
        private RentalStatus status;
        private String rejectReason;
        private LocalDateTime createdAt;

        public static RentalResponse from(ItemRental r) {
            return RentalResponse.builder()
                    .id(r.getId()).itemId(r.getItem().getId()).itemName(r.getItem().getName())
                    .itemCategory(r.getItem().getCategory())
                    .applicantNickname(r.getApplicant().getNickname())
                    .quantity(r.getQuantity()).startDate(r.getStartDate()).endDate(r.getEndDate())
                    .contactPhone(r.getContactPhone()).purpose(r.getPurpose())
                    .status(r.getStatus()).rejectReason(r.getRejectReason())
                    .createdAt(r.getCreatedAt()).build();
        }
    }
}
```

- [ ] **Step 6: Repository 생성**

`ItemRepository.java`:
```java
package com.churchhub.domain.item.repository;

import com.churchhub.domain.item.entity.Item;
import com.churchhub.domain.item.entity.ItemCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ItemRepository extends JpaRepository<Item, Long> {
    List<Item> findAllByOrderByCategoryAscNameAsc();
    List<Item> findAllByCategoryOrderByNameAsc(ItemCategory category);
}
```

`ItemRentalRepository.java`:
```java
package com.churchhub.domain.item.repository;

import com.churchhub.domain.item.entity.ItemRental;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ItemRentalRepository extends JpaRepository<ItemRental, Long> {
    List<ItemRental> findAllByOrderByCreatedAtDesc();
    List<ItemRental> findAllByApplicantIdOrderByCreatedAtDesc(Long userId);
}
```

- [ ] **Step 7: ItemService 생성**

`ItemService.java`:
```java
package com.churchhub.domain.item.service;

import com.churchhub.domain.item.dto.ItemDto;
import com.churchhub.domain.item.entity.Item;
import com.churchhub.domain.item.entity.ItemRental;
import com.churchhub.domain.item.repository.ItemRentalRepository;
import com.churchhub.domain.item.repository.ItemRepository;
import com.churchhub.domain.notification.entity.NotificationType;
import com.churchhub.domain.notification.entity.RelatedType;
import com.churchhub.domain.notification.service.NotificationService;
import com.churchhub.domain.user.entity.User;
import com.churchhub.domain.user.repository.UserRepository;
import com.churchhub.exception.BusinessException;
import com.churchhub.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ItemService {

    private final ItemRepository itemRepository;
    private final ItemRentalRepository itemRentalRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public List<ItemDto.Response> getItems() {
        return itemRepository.findAllByOrderByCategoryAscNameAsc()
                .stream().map(ItemDto.Response::from).toList();
    }

    public List<ItemDto.RentalResponse> getAllRentals() {
        return itemRentalRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(ItemDto.RentalResponse::from).toList();
    }

    public List<ItemDto.RentalResponse> getMyRentals(Long userId) {
        return itemRentalRepository.findAllByApplicantIdOrderByCreatedAtDesc(userId)
                .stream().map(ItemDto.RentalResponse::from).toList();
    }

    @Transactional
    public ItemDto.Response createItem(ItemDto.CreateRequest req) {
        Item item = Item.builder()
                .name(req.getName()).description(req.getDescription())
                .category(req.getCategory()).totalQuantity(req.getTotalQuantity()).build();
        return ItemDto.Response.from(itemRepository.save(item));
    }

    @Transactional
    public ItemDto.RentalResponse applyRental(Long itemId, Long userId, ItemDto.RentalRequest req) {
        if (!req.isTermsAgreed()) throw new BusinessException(ErrorCode.ITEM_TERMS_NOT_AGREED);
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ITEM_NOT_FOUND));
        if (!item.hasStock(req.getQuantity())) throw new BusinessException(ErrorCode.ITEM_OUT_OF_STOCK);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        ItemRental rental = ItemRental.builder()
                .item(item).applicant(user).quantity(req.getQuantity())
                .startDate(req.getStartDate()).endDate(req.getEndDate())
                .contactPhone(req.getContactPhone()).purpose(req.getPurpose())
                .termsAgreed(req.isTermsAgreed()).build();
        return ItemDto.RentalResponse.from(itemRentalRepository.save(rental));
    }

    @Transactional
    public ItemDto.RentalResponse approveRental(Long rentalId) {
        ItemRental rental = itemRentalRepository.findById(rentalId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ITEM_RENTAL_NOT_FOUND));
        rental.approve();
        rental.getItem().decreaseStock(rental.getQuantity());
        notificationService.send(rental.getApplicant(), NotificationType.NOTICE,
                "물품 대여 신청이 승인되었습니다: " + rental.getItem().getName(),
                RelatedType.POST, rentalId);
        return ItemDto.RentalResponse.from(rental);
    }

    @Transactional
    public ItemDto.RentalResponse rejectRental(Long rentalId, String reason) {
        ItemRental rental = itemRentalRepository.findById(rentalId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ITEM_RENTAL_NOT_FOUND));
        rental.reject(reason);
        notificationService.send(rental.getApplicant(), NotificationType.NOTICE,
                "물품 대여 신청이 거절되었습니다: " + rental.getItem().getName(),
                RelatedType.POST, rentalId);
        return ItemDto.RentalResponse.from(rental);
    }
}
```

- [ ] **Step 8: ItemController 생성**

`ItemController.java`:
```java
package com.churchhub.domain.item.api;

import com.churchhub.common.response.ApiResponse;
import com.churchhub.domain.item.dto.ItemDto;
import com.churchhub.domain.item.service.ItemService;
import com.churchhub.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ItemController {

    private final ItemService itemService;

    @GetMapping("/items")
    public ApiResponse<List<ItemDto.Response>> getItems() {
        return ApiResponse.success(itemService.getItems());
    }

    @PostMapping("/items/{id}/rentals")
    public ApiResponse<ItemDto.RentalResponse> applyRental(
            @PathVariable Long id,
            @Valid @RequestBody ItemDto.RentalRequest req,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(itemService.applyRental(id, userDetails.getUserId(), req));
    }

    @GetMapping("/items/rentals/my")
    public ApiResponse<List<ItemDto.RentalResponse>> getMyRentals(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(itemService.getMyRentals(userDetails.getUserId()));
    }

    @PostMapping("/admin/items")
    @PreAuthorize("hasAnyRole('CHURCH_MANAGER', 'SUPER_ADMIN')")
    public ApiResponse<ItemDto.Response> createItem(@Valid @RequestBody ItemDto.CreateRequest req) {
        return ApiResponse.success(itemService.createItem(req));
    }

    @GetMapping("/admin/items/rentals")
    @PreAuthorize("hasAnyRole('CHURCH_MANAGER', 'SUPER_ADMIN')")
    public ApiResponse<List<ItemDto.RentalResponse>> getAllRentals() {
        return ApiResponse.success(itemService.getAllRentals());
    }

    @PutMapping("/admin/items/rentals/{rentalId}/approve")
    @PreAuthorize("hasAnyRole('CHURCH_MANAGER', 'SUPER_ADMIN')")
    public ApiResponse<ItemDto.RentalResponse> approveRental(@PathVariable Long rentalId) {
        return ApiResponse.success(itemService.approveRental(rentalId));
    }

    @PutMapping("/admin/items/rentals/{rentalId}/reject")
    @PreAuthorize("hasAnyRole('CHURCH_MANAGER', 'SUPER_ADMIN')")
    public ApiResponse<ItemDto.RentalResponse> rejectRental(
            @PathVariable Long rentalId,
            @RequestBody ItemDto.RejectRequest req) {
        return ApiResponse.success(itemService.rejectRental(rentalId, req.getReason()));
    }
}
```

- [ ] **Step 9: 빌드 확인**

```bash
cd backend
JAVA_HOME="/c/Users/taeyeop/.jdks/graalvm-jdk-21.0.7" ./gradlew compileJava
```
Expected: BUILD SUCCESSFUL

- [ ] **Step 10: SecurityConfig에 공개 Item API 추가**

`SecurityConfig.java`에 추가:
```java
.requestMatchers(HttpMethod.GET, "/api/v1/spaces/**").permitAll()
.requestMatchers(HttpMethod.GET, "/api/v1/items/**").permitAll()
```

- [ ] **Step 11: Commit**

```bash
git add backend/src/main/java/com/churchhub/domain/item/ \
        backend/src/main/java/com/churchhub/config/SecurityConfig.java \
        backend/src/main/java/com/churchhub/exception/ErrorCode.java
git commit -m "feat: Item 도메인 추가 (물품 대여 신청·승인·거절)"
```
