# Admin 자원 관리 (공간/물품 CRUD + 교회 연결) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin에서 공간/물품을 교회별로 등록·수정·삭제할 수 있게 하고, 사용자 화면에서도 교회명이 표시되도록 한다.

**Architecture:** 백엔드는 기존 SpaceController/ItemController에 누락된 Admin CRUD 엔드포인트를 추가하고, Item entity에 church 연결을 추가한다. 프론트엔드 Admin 페이지는 탭 구조(자원 목록 CRUD | 신청 관리)로 재작성한다.

**Tech Stack:** Spring Boot 3.2.5 + JPA, Next.js 14 (App Router), TypeScript, Tailwind CSS, Flyway migration

## Global Constraints
- Java 21, GraalVM: `JAVA_HOME="/c/Users/taeyeop/.jdks/graalvm-jdk-21.0.7" ./gradlew`
- API prefix: `/api/v1/`
- 응답 wrapper: `ApiResponse<T>` (`com.churchhub.common.response.ApiResponse`)
- Admin 권한: `@PreAuthorize("hasAnyRole('CHURCH_MANAGER', 'SUPER_ADMIN')")`
- Flyway migration 파일명: `V{n}__{description}.sql` — 현재 최신은 V3, 다음은 V4
- 디자인: 메인 블루 `#003478`, 보더 `#EDEFF1`, 배경 `#f4f6f8`
- 에러코드는 `com.churchhub.exception.ErrorCode` enum에 추가

---

## 변경 파일 맵

**백엔드 (수정):**
- `backend/src/main/resources/db/migration/V4__add_church_id_to_items.sql` — 신규
- `backend/src/main/java/com/churchhub/domain/item/entity/Item.java` — church 필드 추가
- `backend/src/main/java/com/churchhub/domain/item/dto/ItemDto.java` — churchId 필드 추가, UpdateRequest 추가
- `backend/src/main/java/com/churchhub/domain/item/service/ItemService.java` — church 연결, getAdminItems/updateItem/deleteItem 추가
- `backend/src/main/java/com/churchhub/domain/item/repository/ItemRepository.java` — findAllByOrderByCreatedAtDesc 추가
- `backend/src/main/java/com/churchhub/domain/item/api/ItemController.java` — GET/PUT/DELETE /admin/items 추가
- `backend/src/main/java/com/churchhub/domain/space/dto/SpaceDto.java` — churchId 필드, UpdateRequest 추가
- `backend/src/main/java/com/churchhub/domain/space/service/SpaceService.java` — getAdminSpaces/updateSpace/deleteSpace 추가
- `backend/src/main/java/com/churchhub/domain/space/api/SpaceController.java` — GET/PUT/DELETE /admin/spaces 추가

**프론트엔드 (수정):**
- `frontend/src/types/index.ts` — Space에 churchId, Item에 churchId/churchName 추가
- `frontend/src/app/admin/spaces/page.tsx` — 탭 구조로 재작성
- `frontend/src/app/admin/items/page.tsx` — 탭 구조로 재작성

---

## Task 1: Item-Church DB + Entity 연결

**Files:**
- Create: `backend/src/main/resources/db/migration/V4__add_church_id_to_items.sql`
- Modify: `backend/src/main/java/com/churchhub/domain/item/entity/Item.java`

**Interfaces:**
- Produces: `Item.getChurch()` — `Church` nullable, Item entity의 church 참조

- [ ] **Step 1: V4 migration 파일 생성**

`backend/src/main/resources/db/migration/V4__add_church_id_to_items.sql`:
```sql
ALTER TABLE items ADD COLUMN church_id BIGINT REFERENCES churches(id) ON DELETE SET NULL;
```

- [ ] **Step 2: Item entity에 church 필드 추가**

`Item.java` 전체를 아래로 교체:
```java
package com.churchhub.domain.item.entity;

import com.churchhub.domain.church.entity.Church;
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "church_id")
    private Church church;

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
    public Item(Church church, String name, String description, ItemCategory category, int totalQuantity) {
        this.church = church;
        this.name = name;
        this.description = description;
        this.category = category;
        this.totalQuantity = totalQuantity;
        this.availableQuantity = totalQuantity;
    }

    public void update(Church church, String name, String description, ItemCategory category, int totalQuantity) {
        this.church = church;
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

- [ ] **Step 3: 빌드 확인**

```bash
cd /c/church-community/backend
JAVA_HOME="/c/Users/taeyeop/.jdks/graalvm-jdk-21.0.7" ./gradlew compileJava
```
Expected: BUILD SUCCESSFUL

- [ ] **Step 4: 커밋**

```bash
cd /c/church-community
git add backend/src/main/resources/db/migration/V4__add_church_id_to_items.sql
git add backend/src/main/java/com/churchhub/domain/item/entity/Item.java
git commit -m "feat: add church_id to items table and entity"
```

---

## Task 2: ItemDto 업데이트 (churchId 필드 + UpdateRequest)

**Files:**
- Modify: `backend/src/main/java/com/churchhub/domain/item/dto/ItemDto.java`

**Interfaces:**
- Produces:
  - `ItemDto.CreateRequest.getChurchId()` — `Long` nullable
  - `ItemDto.UpdateRequest` — name, description, category, totalQuantity, churchId
  - `ItemDto.Response.churchId` — `Long` nullable
  - `ItemDto.Response.churchName` — `String` nullable

- [ ] **Step 1: ItemDto.java 전체 교체**

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
        private Long churchId;
        @NotBlank private String name;
        private String description;
        @NotNull private ItemCategory category;
        private int totalQuantity = 1;
    }

    @Getter
    public static class UpdateRequest {
        private Long churchId;
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
        private Long churchId;
        private String churchName;
        private String name;
        private String description;
        private ItemCategory category;
        private int totalQuantity;
        private int availableQuantity;

        public static Response from(Item i) {
            return Response.builder()
                    .id(i.getId())
                    .churchId(i.getChurch() != null ? i.getChurch().getId() : null)
                    .churchName(i.getChurch() != null ? i.getChurch().getName() : null)
                    .name(i.getName())
                    .description(i.getDescription())
                    .category(i.getCategory())
                    .totalQuantity(i.getTotalQuantity())
                    .availableQuantity(i.getAvailableQuantity())
                    .build();
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

- [ ] **Step 2: 빌드 확인**

```bash
JAVA_HOME="/c/Users/taeyeop/.jdks/graalvm-jdk-21.0.7" ./gradlew compileJava
```
Expected: BUILD SUCCESSFUL (ItemService 컴파일 오류 발생 예정 — 다음 task에서 수정)

- [ ] **Step 3: 커밋**

```bash
git add backend/src/main/java/com/churchhub/domain/item/dto/ItemDto.java
git commit -m "feat: add churchId/churchName to ItemDto, add UpdateRequest"
```

---

## Task 3: ItemService + ItemRepository + ItemController Admin CRUD 추가

**Files:**
- Modify: `backend/src/main/java/com/churchhub/domain/item/repository/ItemRepository.java`
- Modify: `backend/src/main/java/com/churchhub/domain/item/service/ItemService.java`
- Modify: `backend/src/main/java/com/churchhub/domain/item/api/ItemController.java`

**Interfaces:**
- Consumes: `ItemDto.CreateRequest.getChurchId()`, `ItemDto.UpdateRequest`, `Item.update(Church, ...)`
- Produces:
  - `GET /api/v1/admin/items` → `ApiResponse<List<ItemDto.Response>>`
  - `PUT /api/v1/admin/items/{id}` → `ApiResponse<ItemDto.Response>`
  - `DELETE /api/v1/admin/items/{id}` → `ApiResponse<Void>`

- [ ] **Step 1: ItemRepository에 정렬 메서드 추가**

```java
package com.churchhub.domain.item.repository;

import com.churchhub.domain.item.entity.Item;
import com.churchhub.domain.item.entity.ItemCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ItemRepository extends JpaRepository<Item, Long> {
    List<Item> findAllByOrderByCategoryAscNameAsc();
    List<Item> findAllByCategoryOrderByNameAsc(ItemCategory category);
    List<Item> findAllByOrderByCreatedAtDesc();
}
```

- [ ] **Step 2: ItemService 전체 교체**

```java
package com.churchhub.domain.item.service;

import com.churchhub.domain.church.entity.Church;
import com.churchhub.domain.church.repository.ChurchRepository;
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
    private final ChurchRepository churchRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public List<ItemDto.Response> getItems() {
        return itemRepository.findAllByOrderByCategoryAscNameAsc()
                .stream().map(ItemDto.Response::from).toList();
    }

    public List<ItemDto.Response> getAdminItems() {
        return itemRepository.findAllByOrderByCreatedAtDesc()
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
        Church church = resolveChurch(req.getChurchId());
        Item item = Item.builder()
                .church(church).name(req.getName()).description(req.getDescription())
                .category(req.getCategory()).totalQuantity(req.getTotalQuantity()).build();
        return ItemDto.Response.from(itemRepository.save(item));
    }

    @Transactional
    public ItemDto.Response updateItem(Long id, ItemDto.UpdateRequest req) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.ITEM_NOT_FOUND));
        Church church = resolveChurch(req.getChurchId());
        item.update(church, req.getName(), req.getDescription(), req.getCategory(), req.getTotalQuantity());
        return ItemDto.Response.from(item);
    }

    @Transactional
    public void deleteItem(Long id) {
        if (!itemRepository.existsById(id)) throw new BusinessException(ErrorCode.ITEM_NOT_FOUND);
        itemRepository.deleteById(id);
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
        notificationService.send(
                rental.getApplicant().getId(), null, NotificationType.NOTICE,
                "물품 대여 신청이 승인되었습니다: " + rental.getItem().getName(),
                rentalId, RelatedType.POST);
        return ItemDto.RentalResponse.from(rental);
    }

    @Transactional
    public ItemDto.RentalResponse rejectRental(Long rentalId, String reason) {
        ItemRental rental = itemRentalRepository.findById(rentalId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ITEM_RENTAL_NOT_FOUND));
        rental.reject(reason);
        notificationService.send(
                rental.getApplicant().getId(), null, NotificationType.NOTICE,
                "물품 대여 신청이 거절되었습니다: " + rental.getItem().getName(),
                rentalId, RelatedType.POST);
        return ItemDto.RentalResponse.from(rental);
    }

    private Church resolveChurch(Long churchId) {
        if (churchId == null) return null;
        return churchRepository.findById(churchId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHURCH_NOT_FOUND));
    }
}
```

- [ ] **Step 3: ItemController에 Admin CRUD 엔드포인트 추가**

`ItemController.java` 전체 교체:
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

    @GetMapping("/admin/items")
    @PreAuthorize("hasAnyRole('CHURCH_MANAGER', 'SUPER_ADMIN')")
    public ApiResponse<List<ItemDto.Response>> getAdminItems() {
        return ApiResponse.success(itemService.getAdminItems());
    }

    @PostMapping("/admin/items")
    @PreAuthorize("hasAnyRole('CHURCH_MANAGER', 'SUPER_ADMIN')")
    public ApiResponse<ItemDto.Response> createItem(@Valid @RequestBody ItemDto.CreateRequest req) {
        return ApiResponse.success(itemService.createItem(req));
    }

    @PutMapping("/admin/items/{id}")
    @PreAuthorize("hasAnyRole('CHURCH_MANAGER', 'SUPER_ADMIN')")
    public ApiResponse<ItemDto.Response> updateItem(
            @PathVariable Long id,
            @Valid @RequestBody ItemDto.UpdateRequest req) {
        return ApiResponse.success(itemService.updateItem(id, req));
    }

    @DeleteMapping("/admin/items/{id}")
    @PreAuthorize("hasAnyRole('CHURCH_MANAGER', 'SUPER_ADMIN')")
    public ApiResponse<Void> deleteItem(@PathVariable Long id) {
        itemService.deleteItem(id);
        return ApiResponse.success(null);
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

- [ ] **Step 4: 빌드 확인**

```bash
JAVA_HOME="/c/Users/taeyeop/.jdks/graalvm-jdk-21.0.7" ./gradlew compileJava
```
Expected: BUILD SUCCESSFUL

- [ ] **Step 5: 커밋**

```bash
git add backend/src/main/java/com/churchhub/domain/item/
git commit -m "feat: add admin item CRUD endpoints with church association"
```

---

## Task 4: Space Admin CRUD 완성 (SpaceDto + SpaceService + SpaceController)

**Files:**
- Modify: `backend/src/main/java/com/churchhub/domain/space/dto/SpaceDto.java`
- Modify: `backend/src/main/java/com/churchhub/domain/space/service/SpaceService.java`
- Modify: `backend/src/main/java/com/churchhub/domain/space/api/SpaceController.java`

**Interfaces:**
- Produces:
  - `GET /api/v1/admin/spaces` → `ApiResponse<List<SpaceDto.Response>>`
  - `PUT /api/v1/admin/spaces/{id}` → `ApiResponse<SpaceDto.Response>`
  - `DELETE /api/v1/admin/spaces/{id}` → `ApiResponse<Void>`
  - `SpaceDto.Response.churchId` — Long nullable (수정 폼 pre-populate용)

- [ ] **Step 1: SpaceDto.java 전체 교체**

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
    public static class UpdateRequest {
        @NotNull private Long churchId;
        @NotBlank private String name;
        private String description;
        private String usageTypes;
        private Integer capacity;
        private boolean available = true;
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
        private Long churchId;
        private String churchName;
        private String name;
        private String description;
        private String usageTypes;
        private Integer capacity;
        private boolean available;

        public static Response from(Space s) {
            return Response.builder()
                    .id(s.getId())
                    .churchId(s.getChurch() != null ? s.getChurch().getId() : null)
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

- [ ] **Step 2: SpaceService에 getAdminSpaces / updateSpace / deleteSpace 추가**

`SpaceService.java`에서 `getSpaces()` 메서드 아래에 추가:
```java
public List<SpaceDto.Response> getAdminSpaces() {
    return spaceRepository.findAllByOrderByCreatedAtDesc()
            .stream().map(SpaceDto.Response::from).toList();
}

@Transactional
public SpaceDto.Response updateSpace(Long id, SpaceDto.UpdateRequest req) {
    Space space = spaceRepository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.SPACE_NOT_FOUND));
    Church church = churchRepository.findById(req.getChurchId())
            .orElseThrow(() -> new BusinessException(ErrorCode.CHURCH_NOT_FOUND));
    space.update(req.getName(), req.getDescription(), req.getUsageTypes(), req.getCapacity(), req.isAvailable());
    // church 변경: Space.update()가 church를 받지 않으므로 setChurch 필요 — 아래 Step 3에서 처리
    return SpaceDto.Response.from(space);
}

@Transactional
public void deleteSpace(Long id) {
    if (!spaceRepository.existsById(id)) throw new BusinessException(ErrorCode.SPACE_NOT_FOUND);
    spaceRepository.deleteById(id);
}
```

- [ ] **Step 3: Space entity에 updateChurch 메서드 추가**

`Space.java`의 `update()` 메서드를 아래로 교체:
```java
public void update(String name, String description, String usageTypes, Integer capacity, boolean available) {
    this.name = name;
    this.description = description;
    this.usageTypes = usageTypes;
    this.capacity = capacity;
    this.available = available;
}

public void updateChurch(Church church) {
    this.church = church;
}
```

그리고 `SpaceService.updateSpace()`를 완성:
```java
@Transactional
public SpaceDto.Response updateSpace(Long id, SpaceDto.UpdateRequest req) {
    Space space = spaceRepository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.SPACE_NOT_FOUND));
    Church church = churchRepository.findById(req.getChurchId())
            .orElseThrow(() -> new BusinessException(ErrorCode.CHURCH_NOT_FOUND));
    space.update(req.getName(), req.getDescription(), req.getUsageTypes(), req.getCapacity(), req.isAvailable());
    space.updateChurch(church);
    return SpaceDto.Response.from(space);
}
```

- [ ] **Step 4: SpaceController에 Admin CRUD 엔드포인트 추가**

`SpaceController.java` 전체 교체:
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

    @GetMapping("/admin/spaces")
    @PreAuthorize("hasAnyRole('CHURCH_MANAGER', 'SUPER_ADMIN')")
    public ApiResponse<List<SpaceDto.Response>> getAdminSpaces() {
        return ApiResponse.success(spaceService.getAdminSpaces());
    }

    @PostMapping("/admin/spaces")
    @PreAuthorize("hasAnyRole('CHURCH_MANAGER', 'SUPER_ADMIN')")
    public ApiResponse<SpaceDto.Response> createSpace(@Valid @RequestBody SpaceDto.CreateRequest req) {
        return ApiResponse.success(spaceService.createSpace(req));
    }

    @PutMapping("/admin/spaces/{id}")
    @PreAuthorize("hasAnyRole('CHURCH_MANAGER', 'SUPER_ADMIN')")
    public ApiResponse<SpaceDto.Response> updateSpace(
            @PathVariable Long id,
            @Valid @RequestBody SpaceDto.UpdateRequest req) {
        return ApiResponse.success(spaceService.updateSpace(id, req));
    }

    @DeleteMapping("/admin/spaces/{id}")
    @PreAuthorize("hasAnyRole('CHURCH_MANAGER', 'SUPER_ADMIN')")
    public ApiResponse<Void> deleteSpace(@PathVariable Long id) {
        spaceService.deleteSpace(id);
        return ApiResponse.success(null);
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

- [ ] **Step 5: 빌드 확인**

```bash
JAVA_HOME="/c/Users/taeyeop/.jdks/graalvm-jdk-21.0.7" ./gradlew compileJava
```
Expected: BUILD SUCCESSFUL

- [ ] **Step 6: 커밋**

```bash
git add backend/src/main/java/com/churchhub/domain/space/
git commit -m "feat: add admin space CRUD endpoints (GET list, PUT update, DELETE)"
```

---

## Task 5: Frontend types 업데이트

**Files:**
- Modify: `frontend/src/types/index.ts`

**Interfaces:**
- Produces:
  - `Space.churchId: number | null`
  - `Item.churchId: number | null`
  - `Item.churchName: string | null`

- [ ] **Step 1: types/index.ts의 Space, Item 인터페이스 수정**

`Space` 인터페이스 교체:
```typescript
export interface Space {
  id: number;
  churchId: number | null;
  churchName: string | null;
  name: string;
  description: string | null;
  usageTypes: string | null;
  capacity: number | null;
  available: boolean;
}
```

`Item` 인터페이스 교체:
```typescript
export interface Item {
  id: number;
  churchId: number | null;
  churchName: string | null;
  name: string;
  description: string | null;
  category: ItemCategory;
  totalQuantity: number;
  availableQuantity: number;
}
```

- [ ] **Step 2: 타입 체크**

```bash
cd /c/church-community/frontend
npx tsc --noEmit
```
Expected: 오류 없음 (churchName/churchId 관련 타입 오류 없어야 함)

- [ ] **Step 3: 커밋**

```bash
git add frontend/src/types/index.ts
git commit -m "feat: add churchId/churchName to Space and Item types"
```

---

## Task 6: Admin 공간 관리 페이지 재작성 (탭 구조)

**Files:**
- Modify: `frontend/src/app/admin/spaces/page.tsx`

**Interfaces:**
- Consumes:
  - `GET /api/v1/admin/spaces` → `Space[]`
  - `GET /api/v1/churches` → `Church[]`
  - `POST /api/v1/admin/spaces` — body: `{ churchId, name, description, usageTypes, capacity }`
  - `PUT /api/v1/admin/spaces/{id}` — body: `{ churchId, name, description, usageTypes, capacity, available }`
  - `DELETE /api/v1/admin/spaces/{id}`
  - `GET /api/v1/admin/spaces/rentals` → `SpaceRental[]`
  - `PUT /api/v1/admin/spaces/rentals/{id}/approve`
  - `PUT /api/v1/admin/spaces/rentals/{id}/reject` — body: `{ reason }`

- [ ] **Step 1: /admin/spaces/page.tsx 전체 교체**

```tsx
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Space, SpaceRental, Church } from '@/types';

const STATUS_LABEL: Record<string, string> = { PENDING: '대기중', APPROVED: '승인', REJECTED: '거절', CANCELLED: '취소' };
const STATUS_COLOR: Record<string, string> = { PENDING: 'text-amber-500', APPROVED: 'text-green-600', REJECTED: 'text-red-500', CANCELLED: 'text-gray-400' };

const EMPTY_FORM = { churchId: '', name: '', description: '', usageTypes: '', capacity: '', available: true };

export default function AdminSpacesPage() {
  const [tab, setTab] = useState<'spaces' | 'rentals'>('spaces');
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [rentals, setRentals] = useState<SpaceRental[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [loading, setLoading] = useState(true);

  const fetchAll = () => {
    Promise.all([
      api.get('/admin/spaces').then(r => setSpaces(r.data.data ?? [])),
      api.get('/admin/spaces/rentals').then(r => setRentals(r.data.data ?? [])),
      api.get('/churches').then(r => setChurches(r.data.data ?? [])),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => { setEditId(null); setForm({ ...EMPTY_FORM }); setShowForm(true); };
  const openEdit = (s: Space) => {
    setEditId(s.id);
    setForm({
      churchId: s.churchId?.toString() ?? '',
      name: s.name,
      description: s.description ?? '',
      usageTypes: s.usageTypes ?? '',
      capacity: s.capacity?.toString() ?? '',
      available: s.available,
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      churchId: form.churchId ? Number(form.churchId) : null,
      name: form.name,
      description: form.description || null,
      usageTypes: form.usageTypes || null,
      capacity: form.capacity ? Number(form.capacity) : null,
      available: form.available,
    };
    if (editId) {
      await api.put(`/admin/spaces/${editId}`, body);
    } else {
      await api.post('/admin/spaces', body);
    }
    setShowForm(false);
    fetchAll();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('이 공간을 삭제하시겠어요?')) return;
    await api.delete(`/admin/spaces/${id}`);
    fetchAll();
  };

  const approve = async (id: number) => { await api.put(`/admin/spaces/rentals/${id}/approve`); fetchAll(); };
  const reject = async (id: number) => {
    const reason = prompt('거절 사유를 입력하세요');
    if (reason === null) return;
    await api.put(`/admin/spaces/rentals/${id}/reject`, { reason });
    fetchAll();
  };

  if (loading) return <div className="p-6 text-gray-400">불러오는 중...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">공간 관리</h1>
        {tab === 'spaces' && (
          <button onClick={openCreate} className="bg-[#003478] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-900">
            + 공간 추가
          </button>
        )}
      </div>

      {/* 탭 */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {(['spaces', 'rentals'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${tab === t ? 'bg-white text-[#003478] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'spaces' ? `공간 목록 (${spaces.length})` : `신청 관리 (${rentals.filter(r => r.status === 'PENDING').length})`}
          </button>
        ))}
      </div>

      {/* 공간 목록 탭 */}
      {tab === 'spaces' && (
        <div className="space-y-2">
          {spaces.length === 0 ? (
            <div className="bg-white border border-[#EDEFF1] rounded-xl py-16 text-center text-gray-400 text-sm">
              등록된 공간이 없습니다. 공간을 추가해주세요.
            </div>
          ) : spaces.map(s => (
            <div key={s.id} className="bg-white border border-[#EDEFF1] rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{s.name}</span>
                  {!s.available && <span className="text-xs px-2 py-0.5 bg-red-50 text-red-500 rounded-full">대여 불가</span>}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {s.churchName ?? '교회 미지정'} {s.capacity ? `· 최대 ${s.capacity}명` : ''} {s.usageTypes ? `· ${s.usageTypes}` : ''}
                </div>
                {s.description && <div className="text-xs text-gray-500 mt-1">{s.description}</div>}
              </div>
              <div className="flex gap-2 shrink-0 ml-4">
                <button onClick={() => openEdit(s)} className="text-xs text-[#003478] hover:underline">수정</button>
                <button onClick={() => handleDelete(s.id)} className="text-xs text-red-500 hover:underline">삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 신청 관리 탭 */}
      {tab === 'rentals' && (
        <div className="space-y-3">
          {rentals.length === 0 ? (
            <div className="bg-white border border-[#EDEFF1] rounded-xl py-16 text-center text-gray-400 text-sm">신청 내역이 없습니다.</div>
          ) : rentals.map(r => (
            <div key={r.id} className="bg-white border border-[#EDEFF1] rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-sm">{r.spaceName}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{r.applicantNickname} · {r.contactPhone}</div>
                  <div className="text-xs text-gray-500 mt-1">목적: {r.purpose}</div>
                  <div className="text-xs text-gray-500">{r.startDateTime} ~ {r.endDateTime}</div>
                </div>
                <span className={`text-xs font-medium ${STATUS_COLOR[r.status]}`}>{STATUS_LABEL[r.status]}</span>
              </div>
              {r.status === 'PENDING' && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => approve(r.id)} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600">승인</button>
                  <button onClick={() => reject(r.id)} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600">거절</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 공간 등록/수정 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="font-bold text-gray-900 mb-4">{editId ? '공간 수정' : '공간 추가'}</h2>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">교회 *</label>
                <select required value={form.churchId}
                  onChange={e => setForm(p => ({ ...p, churchId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]">
                  <option value="">교회 선택</option>
                  {churches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">공간명 *</label>
                <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]" placeholder="예: 1층 강당" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">설명</label>
                <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]" placeholder="예: 프로젝터, 테이블 8개 구비" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">사용 용도</label>
                <input value={form.usageTypes} onChange={e => setForm(p => ({ ...p, usageTypes: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]" placeholder="예: 모임, 세미나, 예배" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">최대 수용 인원</label>
                <input type="number" min="1" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]" />
              </div>
              {editId && (
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.available} onChange={e => setForm(p => ({ ...p, available: e.target.checked }))} className="accent-[#003478]" />
                  대여 가능
                </label>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-xl hover:bg-gray-50">취소</button>
                <button type="submit" className="px-4 py-2 text-sm bg-[#003478] text-white rounded-xl font-semibold hover:bg-blue-900">저장</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 타입 체크**

```bash
cd /c/church-community/frontend
npx tsc --noEmit
```
Expected: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add frontend/src/app/admin/spaces/page.tsx
git commit -m "feat: rewrite admin spaces page with tab structure (CRUD + rental management)"
```

---

## Task 7: Admin 물품 관리 페이지 재작성 (탭 구조)

**Files:**
- Modify: `frontend/src/app/admin/items/page.tsx`

**Interfaces:**
- Consumes:
  - `GET /api/v1/admin/items` → `Item[]`
  - `GET /api/v1/churches` → `Church[]`
  - `POST /api/v1/admin/items` — body: `{ churchId, name, description, category, totalQuantity }`
  - `PUT /api/v1/admin/items/{id}` — body: `{ churchId, name, description, category, totalQuantity }`
  - `DELETE /api/v1/admin/items/{id}`
  - `GET /api/v1/admin/items/rentals` → `ItemRental[]`
  - `PUT /api/v1/admin/items/rentals/{id}/approve`
  - `PUT /api/v1/admin/items/rentals/{id}/reject` — body: `{ reason }`

- [ ] **Step 1: /admin/items/page.tsx 전체 교체**

```tsx
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Item, ItemRental, Church, ItemCategory } from '@/types';

const STATUS_LABEL: Record<string, string> = { PENDING: '대기중', APPROVED: '승인', REJECTED: '거절', CANCELLED: '취소' };
const STATUS_COLOR: Record<string, string> = { PENDING: 'text-amber-500', APPROVED: 'text-green-600', REJECTED: 'text-red-500', CANCELLED: 'text-gray-400' };
const CATEGORY_LABEL: Record<ItemCategory, string> = { MOVING: '이사', CLEANING: '청소', LIVING: '생활', EVENT: '행사' };

const EMPTY_FORM = { churchId: '', name: '', description: '', category: 'LIVING' as ItemCategory, totalQuantity: '1' };

export default function AdminItemsPage() {
  const [tab, setTab] = useState<'items' | 'rentals'>('items');
  const [items, setItems] = useState<Item[]>([]);
  const [rentals, setRentals] = useState<ItemRental[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [loading, setLoading] = useState(true);

  const fetchAll = () => {
    Promise.all([
      api.get('/admin/items').then(r => setItems(r.data.data ?? [])),
      api.get('/admin/items/rentals').then(r => setRentals(r.data.data ?? [])),
      api.get('/churches').then(r => setChurches(r.data.data ?? [])),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => { setEditId(null); setForm({ ...EMPTY_FORM }); setShowForm(true); };
  const openEdit = (item: Item) => {
    setEditId(item.id);
    setForm({
      churchId: item.churchId?.toString() ?? '',
      name: item.name,
      description: item.description ?? '',
      category: item.category,
      totalQuantity: item.totalQuantity.toString(),
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      churchId: form.churchId ? Number(form.churchId) : null,
      name: form.name,
      description: form.description || null,
      category: form.category,
      totalQuantity: Number(form.totalQuantity),
    };
    if (editId) {
      await api.put(`/admin/items/${editId}`, body);
    } else {
      await api.post('/admin/items', body);
    }
    setShowForm(false);
    fetchAll();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('이 물품을 삭제하시겠어요?')) return;
    await api.delete(`/admin/items/${id}`);
    fetchAll();
  };

  const approve = async (id: number) => { await api.put(`/admin/items/rentals/${id}/approve`); fetchAll(); };
  const reject = async (id: number) => {
    const reason = prompt('거절 사유를 입력하세요');
    if (reason === null) return;
    await api.put(`/admin/items/rentals/${id}/reject`, { reason });
    fetchAll();
  };

  if (loading) return <div className="p-6 text-gray-400">불러오는 중...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">물품 관리</h1>
        {tab === 'items' && (
          <button onClick={openCreate} className="bg-[#003478] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-900">
            + 물품 추가
          </button>
        )}
      </div>

      {/* 탭 */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {(['items', 'rentals'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${tab === t ? 'bg-white text-[#003478] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'items' ? `물품 목록 (${items.length})` : `신청 관리 (${rentals.filter(r => r.status === 'PENDING').length})`}
          </button>
        ))}
      </div>

      {/* 물품 목록 탭 */}
      {tab === 'items' && (
        <div className="space-y-2">
          {items.length === 0 ? (
            <div className="bg-white border border-[#EDEFF1] rounded-xl py-16 text-center text-gray-400 text-sm">
              등록된 물품이 없습니다. 물품을 추가해주세요.
            </div>
          ) : items.map(item => (
            <div key={item.id} className="bg-white border border-[#EDEFF1] rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{item.name}</span>
                  <span className="text-xs px-2 py-0.5 bg-blue-50 text-[#003478] rounded-full">{CATEGORY_LABEL[item.category]}</span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {item.churchName ?? '교회 미지정'} · 총 {item.totalQuantity}개 (대여가능 {item.availableQuantity}개)
                </div>
                {item.description && <div className="text-xs text-gray-500 mt-1">{item.description}</div>}
              </div>
              <div className="flex gap-2 shrink-0 ml-4">
                <button onClick={() => openEdit(item)} className="text-xs text-[#003478] hover:underline">수정</button>
                <button onClick={() => handleDelete(item.id)} className="text-xs text-red-500 hover:underline">삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 신청 관리 탭 */}
      {tab === 'rentals' && (
        <div className="space-y-3">
          {rentals.length === 0 ? (
            <div className="bg-white border border-[#EDEFF1] rounded-xl py-16 text-center text-gray-400 text-sm">신청 내역이 없습니다.</div>
          ) : rentals.map(r => (
            <div key={r.id} className="bg-white border border-[#EDEFF1] rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-sm">{r.itemName} × {r.quantity}개</div>
                  <div className="text-xs text-gray-400 mt-0.5">{r.applicantNickname} · {r.contactPhone}</div>
                  <div className="text-xs text-gray-500 mt-1">{r.startDate} ~ {r.endDate}</div>
                </div>
                <span className={`text-xs font-medium ${STATUS_COLOR[r.status]}`}>{STATUS_LABEL[r.status]}</span>
              </div>
              {r.status === 'PENDING' && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => approve(r.id)} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600">승인</button>
                  <button onClick={() => reject(r.id)} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600">거절</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 물품 등록/수정 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="font-bold text-gray-900 mb-4">{editId ? '물품 수정' : '물품 추가'}</h2>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">교회</label>
                <select value={form.churchId} onChange={e => setForm(p => ({ ...p, churchId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]">
                  <option value="">교회 선택 (선택사항)</option>
                  {churches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">물품명 *</label>
                <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]" placeholder="예: 청소기" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">카테고리 *</label>
                <select required value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value as ItemCategory }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]">
                  <option value="MOVING">이사</option>
                  <option value="CLEANING">청소</option>
                  <option value="LIVING">생활</option>
                  <option value="EVENT">행사</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">설명</label>
                <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]" placeholder="예: 무선 청소기, 충전식" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">총 수량 *</label>
                <input required type="number" min="1" value={form.totalQuantity}
                  onChange={e => setForm(p => ({ ...p, totalQuantity: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]" />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-xl hover:bg-gray-50">취소</button>
                <button type="submit" className="px-4 py-2 text-sm bg-[#003478] text-white rounded-xl font-semibold hover:bg-blue-900">저장</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 타입 체크**

```bash
cd /c/church-community/frontend
npx tsc --noEmit
```
Expected: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add frontend/src/app/admin/items/page.tsx
git commit -m "feat: rewrite admin items page with tab structure (CRUD + rental management)"
```

---

## 최종 확인

- [ ] **백엔드 전체 빌드**

```bash
cd /c/church-community/backend
JAVA_HOME="/c/Users/taeyeop/.jdks/graalvm-jdk-21.0.7" ./gradlew build -x test
```
Expected: BUILD SUCCESSFUL

- [ ] **프론트엔드 타입 체크**

```bash
cd /c/church-community/frontend
npx tsc --noEmit
```
Expected: 오류 없음

- [ ] **git push**

```bash
cd /c/church-community
git push origin main
```
