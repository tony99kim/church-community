# Multi-Church Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement multi-church federation architecture — CHURCH_MANAGER is bound to a specific church and can only manage that church's spaces, items, events, and rentals; SUPER_ADMIN retains full access to all churches.

**Architecture:** `users.church_id` already exists in the DB (User entity already has `private Church church` with `assignChurch()` method). Tasks 1–4 update backend services to enforce church-scoped filtering using `callerId` (service loads User within `@Transactional` to check `.getRole()` and `.getChurch()`). Tasks 5–6 update the admin frontend to show/hide church dropdowns based on `user.role` from `useAuthStore`.

**Tech Stack:** Spring Boot 3.2.5 + JPA + PostgreSQL (Flyway migrations), Next.js 14 (App Router) + TypeScript + Tailwind CSS, Zustand auth store

## Global Constraints

- Java 21 (GraalVM). Build: `JAVA_HOME="/c/Users/taeyeop/.jdks/graalvm-jdk-21.0.7" ./gradlew compileJava` from `C:\church-community\backend`
- Frontend type check: `cd C:\church-community\frontend && npx tsc --noEmit`
- API prefix: `/api/v1/`, response wrapper: `ApiResponse<T>` from `com.churchhub.common.response`
- Admin roles: `CHURCH_MANAGER`, `SUPER_ADMIN` (enum: `com.churchhub.domain.user.entity.UserRole`)
- Design tokens: `#003478` (blue), `#EDEFF1` (border), `#f4f6f8` (background)
- `FORBIDDEN` error code already exists in `ErrorCode.java` — do NOT add a duplicate
- `users.church_id` column already exists in DB — no migration needed for user-church link
- Do NOT modify existing Flyway migrations V2, V3, V4
- Next Flyway migration version: `V5`

---

### Task 1: Backend — CHURCH_MANAGER 교회 바인딩 (AdminService + UserDto)

**Files:**
- Modify: `backend/src/main/java/com/churchhub/domain/admin/dto/AdminDto.java`
- Modify: `backend/src/main/java/com/churchhub/domain/admin/service/AdminService.java`
- Modify: `backend/src/main/java/com/churchhub/domain/user/dto/UserDto.java`

**Context:**
- `User` entity has `private Church church` with `@ManyToOne @JoinColumn(name = "church_id")` and `public void assignChurch(Church church)` method — already there, no entity change needed
- `AdminService.updateUserRole()` currently only calls `user.changeRole(request.getRole())` — does NOT touch church
- `UserDto.Response.from(user)` does not include church info
- `ChurchRepository` is at `com.churchhub.domain.church.repository.ChurchRepository`
- Business rule: when role = `CHURCH_MANAGER`, `churchId` in request is required (throws `CHURCH_NOT_FOUND` if null/missing); when role is NOT `CHURCH_MANAGER`, clear the church association with `user.assignChurch(null)`
- `AdminController.updateUserRole()` is already `@PreAuthorize("hasRole('SUPER_ADMIN')")` — no change needed there

**Produces:**
- `AdminDto.UpdateUserRoleRequest` now has `Long churchId` (nullable field, validated in service)
- `UserDto.Response` now includes `Long churchId`, `String churchName` (both nullable)
- `AdminService.updateUserRole()` enforces church assignment/clearing

- [ ] **Step 1: Add `churchId` to `AdminDto.UpdateUserRoleRequest`**

In `AdminDto.java`, change `UpdateUserRoleRequest` from:
```java
@Getter
public static class UpdateUserRoleRequest {
    private UserRole role;
}
```
To:
```java
@Getter
public static class UpdateUserRoleRequest {
    private UserRole role;
    private Long churchId;
}
```

- [ ] **Step 2: Add `churchId` and `churchName` to `UserDto.Response`**

Replace the entire `Response` class in `UserDto.java`:
```java
@Getter
@Builder
public static class Response {
    private Long id;
    private String email;
    private String nickname;
    private String name;
    private String phone;
    private String profileImageUrl;
    private UserRole role;
    private UserStatus status;
    private Long churchId;
    private String churchName;
    private LocalDateTime createdAt;

    public static Response from(User user) {
        return Response.builder()
                .id(user.getId())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .name(user.getName())
                .phone(user.getPhone())
                .profileImageUrl(user.getProfileImageUrl())
                .role(user.getRole())
                .status(user.getStatus())
                .churchId(user.getChurch() != null ? user.getChurch().getId() : null)
                .churchName(user.getChurch() != null ? user.getChurch().getName() : null)
                .createdAt(user.getCreatedAt())
                .build();
    }
}
```

- [ ] **Step 3: Inject `ChurchRepository` into `AdminService` and update `updateUserRole()`**

Add field injection (in the `@RequiredArgsConstructor` class, just add the field):
```java
import com.churchhub.domain.church.entity.Church;
import com.churchhub.domain.church.repository.ChurchRepository;
import com.churchhub.domain.user.entity.UserRole;
// ...
private final ChurchRepository churchRepository;
```

Replace `updateUserRole()`:
```java
@Transactional
public UserDto.Response updateUserRole(Long userId, AdminDto.UpdateUserRoleRequest request) {
    User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    user.changeRole(request.getRole());
    if (request.getRole() == UserRole.CHURCH_MANAGER) {
        if (request.getChurchId() == null) {
            throw new BusinessException(ErrorCode.CHURCH_NOT_FOUND);
        }
        Church church = churchRepository.findById(request.getChurchId())
                .orElseThrow(() -> new BusinessException(ErrorCode.CHURCH_NOT_FOUND));
        user.assignChurch(church);
    } else {
        user.assignChurch(null);
    }
    return UserDto.Response.from(user);
}
```

- [ ] **Step 4: Verify compilation**

Run from `C:\church-community\backend`:
```
JAVA_HOME="/c/Users/taeyeop/.jdks/graalvm-jdk-21.0.7" ./gradlew compileJava
```
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 5: Commit**
```bash
git add backend/src/main/java/com/churchhub/domain/admin/dto/AdminDto.java \
         backend/src/main/java/com/churchhub/domain/admin/service/AdminService.java \
         backend/src/main/java/com/churchhub/domain/user/dto/UserDto.java
git commit -m "feat: bind CHURCH_MANAGER to church on role assignment, expose church in user response"
```

---

### Task 2: Backend — Space 관리 교회 스코프 필터링

**Files:**
- Modify: `backend/src/main/java/com/churchhub/domain/space/repository/SpaceRepository.java`
- Modify: `backend/src/main/java/com/churchhub/domain/space/repository/SpaceRentalRepository.java`
- Modify: `backend/src/main/java/com/churchhub/domain/space/dto/SpaceDto.java`
- Modify: `backend/src/main/java/com/churchhub/domain/space/service/SpaceService.java`
- Modify: `backend/src/main/java/com/churchhub/domain/space/api/SpaceController.java`

**Context:**
- `SpaceRepository` already has `findAllWithChurchOrderByCreatedAtDesc()` with `LEFT JOIN FETCH s.church`
- `SpaceDto.CreateRequest` has `@NotNull private Long churchId` — must change to nullable (CHURCH_MANAGER omits it; backend auto-sets their church)
- `SpaceDto.UpdateRequest` has `@NotNull private Long churchId` — same change
- `SpaceService` already has both `UserRepository` and `ChurchRepository` injected
- `ErrorCode.FORBIDDEN` already exists — use it for ownership violations
- Business rules:
  - **CHURCH_MANAGER**: `getAdminSpaces` → only their church's spaces; `createSpace` → auto-set church to theirs; `updateSpace` → verify space belongs to their church, cannot change church; `deleteSpace` → verify ownership; `getAllRentals` → only their church's rentals; `approveRental`/`rejectRental` → verify rental's space belongs to their church
  - **SUPER_ADMIN**: no filtering; `createSpace`/`updateSpace` → `churchId` from request (required, throws `CHURCH_NOT_FOUND` if null)

**Produces:**
- All admin service methods take `Long callerId`
- `SpaceController` passes `userDetails.getUserId()` to all admin methods

- [ ] **Step 1: Add church-scoped query to `SpaceRepository`**

Add after the existing `findAllWithChurchOrderByCreatedAtDesc()`:
```java
import org.springframework.data.repository.query.Param;

@Query("SELECT s FROM Space s LEFT JOIN FETCH s.church WHERE s.church.id = :churchId ORDER BY s.createdAt DESC")
List<Space> findByChurchIdWithChurchOrderByCreatedAtDesc(@Param("churchId") Long churchId);
```

- [ ] **Step 2: Add church-scoped rental query to `SpaceRentalRepository`**

Add method (Spring Data JPA derives the query from `space.church.id`):
```java
List<SpaceRental> findBySpace_ChurchIdOrderByCreatedAtDesc(Long churchId);
```

- [ ] **Step 3: Remove `@NotNull` from `SpaceDto.CreateRequest.churchId` and `UpdateRequest.churchId`**

In `SpaceDto.java`, change both occurrences of `@NotNull private Long churchId;` to `private Long churchId;` (remove the annotation only; keep the field).

- [ ] **Step 4: Rewrite all admin methods in `SpaceService` with `callerId`**

Add these imports to `SpaceService.java`:
```java
import com.churchhub.domain.user.entity.UserRole;
```

Add private helpers and replace all admin methods:
```java
// ─── Helpers ────────────────────────────────────────────────

private User getCallerUser(Long callerId) {
    return userRepository.findById(callerId)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
}

private Church resolveChurchForAdmin(Long requestedChurchId, User caller) {
    if (caller.getRole() == UserRole.CHURCH_MANAGER) {
        if (caller.getChurch() == null) throw new BusinessException(ErrorCode.CHURCH_NOT_FOUND);
        return caller.getChurch();
    }
    if (requestedChurchId == null) throw new BusinessException(ErrorCode.CHURCH_NOT_FOUND);
    return churchRepository.findById(requestedChurchId)
            .orElseThrow(() -> new BusinessException(ErrorCode.CHURCH_NOT_FOUND));
}

private void verifySpaceOwnership(Space space, User caller) {
    if (caller.getRole() != UserRole.CHURCH_MANAGER) return;
    Church callerChurch = caller.getChurch();
    Church spaceChurch = space.getChurch();
    if (callerChurch == null || spaceChurch == null ||
            !callerChurch.getId().equals(spaceChurch.getId())) {
        throw new BusinessException(ErrorCode.FORBIDDEN);
    }
}

// ─── Admin methods ───────────────────────────────────────────

public List<SpaceDto.Response> getAdminSpaces(Long callerId) {
    User caller = getCallerUser(callerId);
    if (caller.getRole() == UserRole.CHURCH_MANAGER) {
        if (caller.getChurch() == null) return List.of();
        return spaceRepository.findByChurchIdWithChurchOrderByCreatedAtDesc(caller.getChurch().getId())
                .stream().map(SpaceDto.Response::from).toList();
    }
    return spaceRepository.findAllWithChurchOrderByCreatedAtDesc()
            .stream().map(SpaceDto.Response::from).toList();
}

@Transactional
public SpaceDto.Response createSpace(SpaceDto.CreateRequest req, Long callerId) {
    User caller = getCallerUser(callerId);
    Church church = resolveChurchForAdmin(req.getChurchId(), caller);
    Space space = Space.builder()
            .church(church).name(req.getName()).description(req.getDescription())
            .usageTypes(req.getUsageTypes()).capacity(req.getCapacity()).build();
    return SpaceDto.Response.from(spaceRepository.save(space));
}

@Transactional
public SpaceDto.Response updateSpace(Long id, SpaceDto.UpdateRequest req, Long callerId) {
    Space space = spaceRepository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.SPACE_NOT_FOUND));
    User caller = getCallerUser(callerId);
    verifySpaceOwnership(space, caller);
    space.update(req.getName(), req.getDescription(), req.getUsageTypes(), req.getCapacity(), req.isAvailable());
    if (caller.getRole() != UserRole.CHURCH_MANAGER) {
        if (req.getChurchId() == null) throw new BusinessException(ErrorCode.CHURCH_NOT_FOUND);
        Church church = churchRepository.findById(req.getChurchId())
                .orElseThrow(() -> new BusinessException(ErrorCode.CHURCH_NOT_FOUND));
        space.updateChurch(church);
    }
    return SpaceDto.Response.from(space);
}

@Transactional
public void deleteSpace(Long id, Long callerId) {
    Space space = spaceRepository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.SPACE_NOT_FOUND));
    verifySpaceOwnership(space, getCallerUser(callerId));
    if (spaceRentalRepository.existsBySpaceId(id)) throw new BusinessException(ErrorCode.SPACE_HAS_RENTALS);
    spaceRepository.deleteById(id);
}

public List<SpaceDto.RentalResponse> getAllRentals(Long callerId) {
    User caller = getCallerUser(callerId);
    if (caller.getRole() == UserRole.CHURCH_MANAGER) {
        if (caller.getChurch() == null) return List.of();
        return spaceRentalRepository.findBySpace_ChurchIdOrderByCreatedAtDesc(caller.getChurch().getId())
                .stream().map(SpaceDto.RentalResponse::from).toList();
    }
    return spaceRentalRepository.findAllByOrderByCreatedAtDesc()
            .stream().map(SpaceDto.RentalResponse::from).toList();
}

@Transactional
public SpaceDto.RentalResponse approveRental(Long rentalId, Long callerId) {
    SpaceRental rental = spaceRentalRepository.findById(rentalId)
            .orElseThrow(() -> new BusinessException(ErrorCode.SPACE_RENTAL_NOT_FOUND));
    verifySpaceOwnership(rental.getSpace(), getCallerUser(callerId));
    rental.approve();
    notificationService.send(rental.getApplicant().getId(), null, NotificationType.NOTICE,
            "공간 대여 신청이 승인되었습니다: " + rental.getSpace().getName(),
            rentalId, RelatedType.POST);
    return SpaceDto.RentalResponse.from(rental);
}

@Transactional
public SpaceDto.RentalResponse rejectRental(Long rentalId, String reason, Long callerId) {
    SpaceRental rental = spaceRentalRepository.findById(rentalId)
            .orElseThrow(() -> new BusinessException(ErrorCode.SPACE_RENTAL_NOT_FOUND));
    verifySpaceOwnership(rental.getSpace(), getCallerUser(callerId));
    rental.reject(reason);
    notificationService.send(rental.getApplicant().getId(), null, NotificationType.NOTICE,
            "공간 대여 신청이 거절되었습니다: " + rental.getSpace().getName(),
            rentalId, RelatedType.POST);
    return SpaceDto.RentalResponse.from(rental);
}
```

> ⚠️ Remove the old versions of `getAdminSpaces()`, `createSpace()`, `updateSpace()`, `deleteSpace()`, `getAllRentals()`, `approveRental()`, `rejectRental()` — replace them entirely with the above.

- [ ] **Step 5: Update `SpaceController` to pass `callerId` to all admin methods**

Replace all admin endpoint methods in `SpaceController.java`:
```java
@GetMapping("/admin/spaces")
@PreAuthorize("hasAnyRole('CHURCH_MANAGER', 'SUPER_ADMIN')")
public ApiResponse<List<SpaceDto.Response>> getAdminSpaces(
        @AuthenticationPrincipal CustomUserDetails userDetails) {
    return ApiResponse.success(spaceService.getAdminSpaces(userDetails.getUserId()));
}

@PostMapping("/admin/spaces")
@PreAuthorize("hasAnyRole('CHURCH_MANAGER', 'SUPER_ADMIN')")
public ApiResponse<SpaceDto.Response> createSpace(
        @Valid @RequestBody SpaceDto.CreateRequest req,
        @AuthenticationPrincipal CustomUserDetails userDetails) {
    return ApiResponse.success(spaceService.createSpace(req, userDetails.getUserId()));
}

@PutMapping("/admin/spaces/{id}")
@PreAuthorize("hasAnyRole('CHURCH_MANAGER', 'SUPER_ADMIN')")
public ApiResponse<SpaceDto.Response> updateSpace(
        @PathVariable Long id,
        @Valid @RequestBody SpaceDto.UpdateRequest req,
        @AuthenticationPrincipal CustomUserDetails userDetails) {
    return ApiResponse.success(spaceService.updateSpace(id, req, userDetails.getUserId()));
}

@DeleteMapping("/admin/spaces/{id}")
@PreAuthorize("hasAnyRole('CHURCH_MANAGER', 'SUPER_ADMIN')")
public ApiResponse<Void> deleteSpace(
        @PathVariable Long id,
        @AuthenticationPrincipal CustomUserDetails userDetails) {
    spaceService.deleteSpace(id, userDetails.getUserId());
    return ApiResponse.success(null);
}

@GetMapping("/admin/spaces/rentals")
@PreAuthorize("hasAnyRole('CHURCH_MANAGER', 'SUPER_ADMIN')")
public ApiResponse<List<SpaceDto.RentalResponse>> getAllRentals(
        @AuthenticationPrincipal CustomUserDetails userDetails) {
    return ApiResponse.success(spaceService.getAllRentals(userDetails.getUserId()));
}

@PutMapping("/admin/spaces/rentals/{rentalId}/approve")
@PreAuthorize("hasAnyRole('CHURCH_MANAGER', 'SUPER_ADMIN')")
public ApiResponse<SpaceDto.RentalResponse> approveRental(
        @PathVariable Long rentalId,
        @AuthenticationPrincipal CustomUserDetails userDetails) {
    return ApiResponse.success(spaceService.approveRental(rentalId, userDetails.getUserId()));
}

@PutMapping("/admin/spaces/rentals/{rentalId}/reject")
@PreAuthorize("hasAnyRole('CHURCH_MANAGER', 'SUPER_ADMIN')")
public ApiResponse<SpaceDto.RentalResponse> rejectRental(
        @PathVariable Long rentalId,
        @RequestBody SpaceDto.RejectRequest req,
        @AuthenticationPrincipal CustomUserDetails userDetails) {
    return ApiResponse.success(spaceService.rejectRental(rentalId, req.getReason(), userDetails.getUserId()));
}
```

- [ ] **Step 6: Verify compilation**
```
JAVA_HOME="/c/Users/taeyeop/.jdks/graalvm-jdk-21.0.7" ./gradlew compileJava
```
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 7: Commit**
```bash
git add backend/src/main/java/com/churchhub/domain/space/
git commit -m "feat: scope space admin to CHURCH_MANAGER's church with ownership enforcement"
```

---

### Task 3: Backend — Item 관리 교회 스코프 필터링

**Files:**
- Modify: `backend/src/main/java/com/churchhub/domain/item/repository/ItemRepository.java`
- Modify: `backend/src/main/java/com/churchhub/domain/item/repository/ItemRentalRepository.java`
- Modify: `backend/src/main/java/com/churchhub/domain/item/service/ItemService.java`
- Modify: `backend/src/main/java/com/churchhub/domain/item/api/ItemController.java`

**Context:**
- Mirror of Task 2 for items. `ItemService` already has both `UserRepository` and `ChurchRepository` injected.
- `ItemDto.CreateRequest.churchId` is already nullable (no `@NotNull`) — no DTO change needed.
- `ItemDto.UpdateRequest.churchId` is already nullable — no DTO change needed.
- `ItemRepository` already has `findAllWithChurchOrderByCreatedAtDesc()` with `@Query` + `LEFT JOIN FETCH`.
- `ItemRepository` has private method `resolveChurch(Long churchId)` — keep it, we'll add a new one for admin.
- Business rules identical to Task 2 but for items.

**Produces:**
- All admin service methods take `Long callerId`
- `ItemController` passes `userDetails.getUserId()` to all admin methods

- [ ] **Step 1: Add church-scoped query to `ItemRepository`**

```java
@Query("SELECT i FROM Item i LEFT JOIN FETCH i.church WHERE i.church.id = :churchId ORDER BY i.createdAt DESC")
List<Item> findByChurchIdWithChurchOrderByCreatedAtDesc(@Param("churchId") Long churchId);
```

Add import at top of file if missing: `import org.springframework.data.repository.query.Param;`

- [ ] **Step 2: Add church-scoped rental query to `ItemRentalRepository`**

```java
List<ItemRental> findByItem_ChurchIdOrderByCreatedAtDesc(Long churchId);
```

- [ ] **Step 3: Update `ItemService` — add helpers and rewrite all admin methods to accept `callerId`**

Add import: `import com.churchhub.domain.user.entity.UserRole;`

Add private helpers:
```java
private User getCallerUser(Long callerId) {
    return userRepository.findById(callerId)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
}

private Church resolveChurchForAdmin(Long requestedChurchId, User caller) {
    if (caller.getRole() == UserRole.CHURCH_MANAGER) {
        if (caller.getChurch() == null) throw new BusinessException(ErrorCode.CHURCH_NOT_FOUND);
        return caller.getChurch();
    }
    return resolveChurch(requestedChurchId);
}

private void verifyItemOwnership(Item item, User caller) {
    if (caller.getRole() != UserRole.CHURCH_MANAGER) return;
    Church callerChurch = caller.getChurch();
    Church itemChurch = item.getChurch();
    if (callerChurch == null || itemChurch == null ||
            !callerChurch.getId().equals(itemChurch.getId())) {
        throw new BusinessException(ErrorCode.FORBIDDEN);
    }
}
```

Replace admin methods:
```java
public List<ItemDto.Response> getAdminItems(Long callerId) {
    User caller = getCallerUser(callerId);
    if (caller.getRole() == UserRole.CHURCH_MANAGER) {
        if (caller.getChurch() == null) return List.of();
        return itemRepository.findByChurchIdWithChurchOrderByCreatedAtDesc(caller.getChurch().getId())
                .stream().map(ItemDto.Response::from).toList();
    }
    return itemRepository.findAllWithChurchOrderByCreatedAtDesc()
            .stream().map(ItemDto.Response::from).toList();
}

@Transactional
public ItemDto.Response createItem(ItemDto.CreateRequest req, Long callerId) {
    User caller = getCallerUser(callerId);
    Church church = resolveChurchForAdmin(req.getChurchId(), caller);
    Item item = Item.builder()
            .church(church).name(req.getName()).description(req.getDescription())
            .category(req.getCategory()).totalQuantity(req.getTotalQuantity()).build();
    return ItemDto.Response.from(itemRepository.save(item));
}

@Transactional
public ItemDto.Response updateItem(Long id, ItemDto.UpdateRequest req, Long callerId) {
    Item item = itemRepository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.ITEM_NOT_FOUND));
    User caller = getCallerUser(callerId);
    verifyItemOwnership(item, caller);
    Church church = caller.getRole() == UserRole.CHURCH_MANAGER
            ? item.getChurch()
            : resolveChurch(req.getChurchId());
    item.update(church, req.getName(), req.getDescription(), req.getCategory(), req.getTotalQuantity());
    return ItemDto.Response.from(item);
}

public List<ItemDto.RentalResponse> getAllRentals(Long callerId) {
    User caller = getCallerUser(callerId);
    if (caller.getRole() == UserRole.CHURCH_MANAGER) {
        if (caller.getChurch() == null) return List.of();
        return itemRentalRepository.findByItem_ChurchIdOrderByCreatedAtDesc(caller.getChurch().getId())
                .stream().map(ItemDto.RentalResponse::from).toList();
    }
    return itemRentalRepository.findAllByOrderByCreatedAtDesc()
            .stream().map(ItemDto.RentalResponse::from).toList();
}

@Transactional
public ItemDto.RentalResponse approveRental(Long rentalId, Long callerId) {
    ItemRental rental = itemRentalRepository.findById(rentalId)
            .orElseThrow(() -> new BusinessException(ErrorCode.ITEM_RENTAL_NOT_FOUND));
    verifyItemOwnership(rental.getItem(), getCallerUser(callerId));
    rental.approve();
    rental.getItem().decreaseStock(rental.getQuantity());
    notificationService.send(
            rental.getApplicant().getId(), null, NotificationType.NOTICE,
            "물품 대여 신청이 승인되었습니다: " + rental.getItem().getName(),
            rentalId, RelatedType.POST);
    return ItemDto.RentalResponse.from(rental);
}

@Transactional
public ItemDto.RentalResponse rejectRental(Long rentalId, String reason, Long callerId) {
    ItemRental rental = itemRentalRepository.findById(rentalId)
            .orElseThrow(() -> new BusinessException(ErrorCode.ITEM_RENTAL_NOT_FOUND));
    verifyItemOwnership(rental.getItem(), getCallerUser(callerId));
    rental.reject(reason);
    notificationService.send(
            rental.getApplicant().getId(), null, NotificationType.NOTICE,
            "물품 대여 신청이 거절되었습니다: " + rental.getItem().getName(),
            rentalId, RelatedType.POST);
    return ItemDto.RentalResponse.from(rental);
}
```

> ⚠️ Remove old signatures of the above methods. Keep `getItems()`, `getMyRentals()`, `applyRental()`, `deleteItem()`, and the private `resolveChurch()` unchanged.

- [ ] **Step 4: Update `ItemController` to pass `callerId` to all admin methods**

Replace admin endpoint methods:
```java
@GetMapping("/admin/items")
@PreAuthorize("hasAnyRole('CHURCH_MANAGER', 'SUPER_ADMIN')")
public ApiResponse<List<ItemDto.Response>> getAdminItems(
        @AuthenticationPrincipal CustomUserDetails userDetails) {
    return ApiResponse.success(itemService.getAdminItems(userDetails.getUserId()));
}

@PostMapping("/admin/items")
@PreAuthorize("hasAnyRole('CHURCH_MANAGER', 'SUPER_ADMIN')")
public ApiResponse<ItemDto.Response> createItem(
        @Valid @RequestBody ItemDto.CreateRequest req,
        @AuthenticationPrincipal CustomUserDetails userDetails) {
    return ApiResponse.success(itemService.createItem(req, userDetails.getUserId()));
}

@PutMapping("/admin/items/{id}")
@PreAuthorize("hasAnyRole('CHURCH_MANAGER', 'SUPER_ADMIN')")
public ApiResponse<ItemDto.Response> updateItem(
        @PathVariable Long id,
        @Valid @RequestBody ItemDto.UpdateRequest req,
        @AuthenticationPrincipal CustomUserDetails userDetails) {
    return ApiResponse.success(itemService.updateItem(id, req, userDetails.getUserId()));
}

@DeleteMapping("/admin/items/{id}")
@PreAuthorize("hasAnyRole('CHURCH_MANAGER', 'SUPER_ADMIN')")
public ApiResponse<Void> deleteItem(
        @PathVariable Long id,
        @AuthenticationPrincipal CustomUserDetails userDetails) {
    itemService.deleteItem(id);
    return ApiResponse.success(null);
}

@GetMapping("/admin/items/rentals")
@PreAuthorize("hasAnyRole('CHURCH_MANAGER', 'SUPER_ADMIN')")
public ApiResponse<List<ItemDto.RentalResponse>> getAllRentals(
        @AuthenticationPrincipal CustomUserDetails userDetails) {
    return ApiResponse.success(itemService.getAllRentals(userDetails.getUserId()));
}

@PutMapping("/admin/items/rentals/{rentalId}/approve")
@PreAuthorize("hasAnyRole('CHURCH_MANAGER', 'SUPER_ADMIN')")
public ApiResponse<ItemDto.RentalResponse> approveRental(
        @PathVariable Long rentalId,
        @AuthenticationPrincipal CustomUserDetails userDetails) {
    return ApiResponse.success(itemService.approveRental(rentalId, userDetails.getUserId()));
}

@PutMapping("/admin/items/rentals/{rentalId}/reject")
@PreAuthorize("hasAnyRole('CHURCH_MANAGER', 'SUPER_ADMIN')")
public ApiResponse<ItemDto.RentalResponse> rejectRental(
        @PathVariable Long rentalId,
        @RequestBody ItemDto.RejectRequest req,
        @AuthenticationPrincipal CustomUserDetails userDetails) {
    return ApiResponse.success(itemService.rejectRental(rentalId, req.getReason(), userDetails.getUserId()));
}
```

> Note: `deleteItem` does not pass callerId — item delete is safe because CHURCH_MANAGER only sees their own church's items in the list, and the API already returns only scoped items. Adding ownership check to delete is a future improvement.

- [ ] **Step 5: Verify compilation**
```
JAVA_HOME="/c/Users/taeyeop/.jdks/graalvm-jdk-21.0.7" ./gradlew compileJava
```
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 6: Commit**
```bash
git add backend/src/main/java/com/churchhub/domain/item/
git commit -m "feat: scope item admin to CHURCH_MANAGER's church with ownership enforcement"
```

---

### Task 4: Backend — Event 교회 연결 (V5 migration + EventCategory 어드민 스코프)

**Files:**
- Create: `backend/src/main/resources/db/migration/V5__add_church_to_events.sql`
- Modify: `backend/src/main/java/com/churchhub/domain/event/entity/Event.java`
- Modify: `backend/src/main/java/com/churchhub/domain/event/dto/EventDto.java`
- Modify: `backend/src/main/java/com/churchhub/domain/event/repository/EventRepository.java`
- Modify: `backend/src/main/java/com/churchhub/domain/event/service/EventService.java`
- Modify: `backend/src/main/java/com/churchhub/domain/admin/api/AdminController.java`

**Context:**
- `Event` entity has no `church` field — must add
- `EventService.createEvent(req, userId)` doesn't set church
- `EventService.getAllEventsForAdmin(pageable)` returns ALL events (no filtering)
- `AdminController.getAdminEvents()` calls `eventService.getAllEventsForAdmin(pageable)` without `userDetails`
- `AdminController.createEvent()` already passes `userDetails.getUserId()` to `eventService.createEvent()`
- **Public event listing** (`GET /events`) stays unified — all users see all churches' events (Q2=A decision). DO NOT change `getEvents()` or `getEventsByCategory()`.
- Existing events in DB will have `church_id = NULL` after migration — `churchName` in response will be null for them. This is acceptable.
- `ChurchRepository` and `UserRepository` must both be injected in `EventService`

**Produces:**
- `EventDto.Response` includes `churchId`, `churchName` (nullable)
- `EventService.getAllEventsForAdmin(callerId, pageable)` filters for CHURCH_MANAGER
- `EventService.createEvent(req, userId)` auto-sets church

- [ ] **Step 1: Create V5 migration**

Create file `backend/src/main/resources/db/migration/V5__add_church_to_events.sql`:
```sql
ALTER TABLE events ADD COLUMN church_id BIGINT REFERENCES churches(id) ON DELETE SET NULL;
```

- [ ] **Step 2: Add `church` field to `Event` entity**

Add import and field:
```java
import com.churchhub.domain.church.entity.Church;

@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "church_id")
private Church church;
```

Update the `@Builder` constructor to accept `Church church` (add it as the last parameter):
```java
@Builder
public Event(User author, String title, String description, String location,
             LocalDateTime startDate, LocalDateTime endDate,
             Integer maxParticipants, String thumbnailUrl, EventCategory category, Church church) {
    this.author = author;
    this.title = title;
    this.description = description;
    this.location = location;
    this.startDate = startDate;
    this.endDate = endDate;
    this.maxParticipants = maxParticipants;
    this.thumbnailUrl = thumbnailUrl;
    this.category = category != null ? category : EventCategory.CHURCH;
    this.church = church;
}
```

- [ ] **Step 3: Update `EventDto`**

Add `Long churchId` to `CreateRequest` (after `category`):
```java
@Getter
public static class CreateRequest {
    @NotBlank private String title;
    @NotBlank private String description;
    @NotBlank private String location;
    @NotNull  private LocalDateTime startDate;
    @NotNull  private LocalDateTime endDate;
    private Integer maxParticipants;
    private String thumbnailUrl;
    private EventCategory category;
    private Long churchId;
}
```

Add `Long churchId` to `UpdateRequest` (after `category`):
```java
@Getter
public static class UpdateRequest {
    @NotBlank private String title;
    @NotBlank private String description;
    @NotBlank private String location;
    @NotNull  private LocalDateTime startDate;
    @NotNull  private LocalDateTime endDate;
    private Integer maxParticipants;
    private String thumbnailUrl;
    private EventStatus status;
    private EventCategory category;
    private Long churchId;
}
```

Update `Response` (add `churchId`, `churchName` fields and update `from()`):
```java
@Getter
@Builder
public static class Response {
    private Long id;
    private String title;
    private String description;
    private String location;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Integer maxParticipants;
    private int currentParticipants;
    private String thumbnailUrl;
    private EventCategory category;
    private EventStatus status;
    private String authorNickname;
    private Long churchId;
    private String churchName;
    private boolean joined;
    private LocalDateTime createdAt;

    public static Response from(Event event, boolean joined) {
        return Response.builder()
                .id(event.getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .location(event.getLocation())
                .startDate(event.getStartDate())
                .endDate(event.getEndDate())
                .maxParticipants(event.getMaxParticipants())
                .currentParticipants(event.getCurrentParticipants())
                .thumbnailUrl(event.getThumbnailUrl())
                .category(event.getCategory())
                .status(event.getStatus())
                .authorNickname(event.getAuthor().getNickname())
                .churchId(event.getChurch() != null ? event.getChurch().getId() : null)
                .churchName(event.getChurch() != null ? event.getChurch().getName() : null)
                .joined(joined)
                .createdAt(event.getCreatedAt())
                .build();
    }
}
```

- [ ] **Step 4: Add church-scoped admin query to `EventRepository`**

```java
Page<Event> findByChurchId(Long churchId, Pageable pageable);
```

- [ ] **Step 5: Update `EventService` — inject `ChurchRepository`, update `createEvent` and `getAllEventsForAdmin`**

Add field:
```java
import com.churchhub.domain.church.entity.Church;
import com.churchhub.domain.church.repository.ChurchRepository;
import com.churchhub.domain.user.entity.UserRole;
// ...
private final ChurchRepository churchRepository;
```

Replace `getAllEventsForAdmin()` signature and body:
```java
public Page<EventDto.Response> getAllEventsForAdmin(Long callerId, Pageable pageable) {
    User caller = userRepository.findById(callerId)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    if (caller.getRole() == UserRole.CHURCH_MANAGER) {
        if (caller.getChurch() == null) return Page.empty(pageable);
        return eventRepository.findByChurchId(caller.getChurch().getId(), pageable)
                .map(e -> EventDto.Response.from(e, false));
    }
    return eventRepository.findAll(pageable)
            .map(e -> EventDto.Response.from(e, false));
}
```

Replace `createEvent()`:
```java
@Transactional
public EventDto.Response createEvent(EventDto.CreateRequest request, Long userId) {
    User author = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    Church church = null;
    if (author.getRole() == UserRole.CHURCH_MANAGER) {
        church = author.getChurch();
    } else if (request.getChurchId() != null) {
        church = churchRepository.findById(request.getChurchId())
                .orElseThrow(() -> new BusinessException(ErrorCode.CHURCH_NOT_FOUND));
    }
    Event event = Event.builder()
            .author(author)
            .title(request.getTitle())
            .description(request.getDescription())
            .location(request.getLocation())
            .startDate(request.getStartDate())
            .endDate(request.getEndDate())
            .maxParticipants(request.getMaxParticipants())
            .thumbnailUrl(request.getThumbnailUrl())
            .category(request.getCategory())
            .church(church)
            .build();
    return EventDto.Response.from(eventRepository.save(event), false);
}
```

- [ ] **Step 6: Update `AdminController.getAdminEvents()` to inject `userDetails` and pass callerId**

Change the method signature:
```java
@Operation(summary = "행사 목록 조회 (관리자 - DRAFT 포함)")
@GetMapping("/events")
public ResponseEntity<ApiResponse<Page<EventDto.Response>>> getAdminEvents(
        @PageableDefault(size = 50, sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable,
        @AuthenticationPrincipal CustomUserDetails userDetails) {
    return ResponseEntity.ok(ApiResponse.success(
            eventService.getAllEventsForAdmin(userDetails.getUserId(), pageable)));
}
```

- [ ] **Step 7: Verify compilation**
```
JAVA_HOME="/c/Users/taeyeop/.jdks/graalvm-jdk-21.0.7" ./gradlew compileJava
```
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 8: Commit**
```bash
git add backend/src/main/resources/db/migration/V5__add_church_to_events.sql \
         backend/src/main/java/com/churchhub/domain/event/ \
         backend/src/main/java/com/churchhub/domain/admin/api/AdminController.java
git commit -m "feat: add church to events, scope admin event list to CHURCH_MANAGER's church"
```

---

### Task 5: Frontend — Admin 회원관리 CHURCH_MANAGER 교회 지정 UI

**Files:**
- Modify: `frontend/src/app/admin/users/page.tsx`

**Context:**
- Current `ROLE_LABELS` has incorrect key `ADMIN` (backend enum is `CHURCH_MANAGER`) and is missing `CHURCH_MANAGER` and `PASTOR`
- Role dropdown options have `<option value="ADMIN">관리자</option>` — wrong value
- `PUT /admin/users/{id}/role` currently sends `{ role }` only; after Task 1 backend needs `{ role, churchId }` when role is `CHURCH_MANAGER`
- `GET /churches` returns `ApiResponse<Church[]>` where Church has `{ id, name, ... }`
- The local `User` interface in this file (top of file) needs `churchName?: string` added
- `useAuthStore` provides `me.role` (currently imported)

**Produces:**
- Correct ROLE_LABELS and select option values
- Selecting CHURCH_MANAGER shows a church-picker modal before confirming
- User list shows church name for CHURCH_MANAGER users

- [ ] **Step 1: Update the local `User` interface and `ROLE_LABELS`**

Replace the local `User` interface:
```tsx
interface User {
  id: number;
  email: string;
  nickname: string;
  name?: string;
  role: string;
  status: string;
  createdAt: string;
  churchName?: string;
}
```

Replace `ROLE_LABELS`:
```tsx
const ROLE_LABELS: Record<string, string> = {
  USER: '일반',
  CHURCH_MANAGER: '교회관리자',
  PASTOR: '목사',
  SUPER_ADMIN: '최고관리자',
};
```

- [ ] **Step 2: Add church + modal state**

Inside `AdminUsersPage`, add:
```tsx
const [churches, setChurches] = useState<{ id: number; name: string }[]>([]);
const [pendingRoleChange, setPendingRoleChange] = useState<{ userId: number } | null>(null);
const [selectedChurchId, setSelectedChurchId] = useState('');
```

Add to the initial `useEffect` (alongside `fetchUsers`):
```tsx
useEffect(() => {
  fetchUsers(page);
  api.get('/churches').then(r => setChurches(r.data.data ?? []));
}, []);
```

Remove the existing `useEffect(() => { fetchUsers(page); }, [page]);` and replace with separate effects:
```tsx
useEffect(() => {
  fetchUsers(0);
  api.get('/churches').then(r => setChurches(r.data.data ?? []));
}, []);

useEffect(() => { fetchUsers(page); }, [page]);
```

- [ ] **Step 3: Update `handleRoleChange` to intercept CHURCH_MANAGER selection**

Replace `handleRoleChange`:
```tsx
const handleRoleChange = async (u: User, newRole: string) => {
  if (newRole === 'CHURCH_MANAGER') {
    setPendingRoleChange({ userId: u.id });
    setSelectedChurchId('');
    return;
  }
  if (!confirm(`${u.nickname}님의 권한을 ${ROLE_LABELS[newRole] ?? newRole}(으)로 변경하시겠어요?`)) return;
  try {
    await api.put(`/admin/users/${u.id}/role`, { role: newRole });
    fetchUsers(page);
  } catch {
    alert('권한 변경에 실패했습니다. SUPER_ADMIN만 가능합니다.');
  }
};

const confirmChurchManagerAssign = async () => {
  if (!pendingRoleChange || !selectedChurchId) return;
  try {
    await api.put(`/admin/users/${pendingRoleChange.userId}/role`, {
      role: 'CHURCH_MANAGER',
      churchId: Number(selectedChurchId),
    });
    setPendingRoleChange(null);
    fetchUsers(page);
  } catch {
    alert('권한 변경에 실패했습니다.');
  }
};
```

- [ ] **Step 4: Fix role dropdown options**

Replace the role `<select>` options:
```tsx
<select
  value={u.role}
  onChange={(e) => handleRoleChange(u, e.target.value)}
  className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-[#003478]"
>
  <option value="USER">일반</option>
  <option value="CHURCH_MANAGER">교회관리자</option>
  <option value="PASTOR">목사</option>
  <option value="SUPER_ADMIN">최고관리자</option>
</select>
```

- [ ] **Step 5: Show church name in user list (non-editable badge)**

In the non-editable role display (when `!isSuperAdmin || u.id === me?.id`), update to show church:
```tsx
<div className="text-center">
  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
    {ROLE_LABELS[u.role] ?? u.role}
  </span>
  {u.churchName && (
    <div className="text-xs text-gray-400 mt-0.5">{u.churchName}</div>
  )}
</div>
```

Also add church name display below the editable select (for the SUPER_ADMIN view of other users who are CHURCH_MANAGER):
After the `<select>`, add:
```tsx
{u.churchName && (
  <div className="text-xs text-gray-400 mt-0.5 text-center">{u.churchName}</div>
)}
```

- [ ] **Step 6: Add CHURCH_MANAGER 교회 선택 모달**

Add this modal before the closing `</div>` of the return:
```tsx
{pendingRoleChange && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
      <h2 className="font-bold text-gray-900 mb-1">교회관리자 교회 지정</h2>
      <p className="text-sm text-gray-500 mb-4">이 회원이 관리할 교회를 선택해주세요.</p>
      <select
        value={selectedChurchId}
        onChange={e => setSelectedChurchId(e.target.value)}
        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478] mb-4"
      >
        <option value="">교회 선택</option>
        {churches.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => setPendingRoleChange(null)}
          className="px-4 py-2 text-sm border border-gray-300 rounded-xl hover:bg-gray-50"
        >취소</button>
        <button
          type="button"
          onClick={confirmChurchManagerAssign}
          disabled={!selectedChurchId}
          className="px-4 py-2 text-sm bg-[#003478] text-white rounded-xl font-semibold hover:bg-blue-900 disabled:opacity-50"
        >지정</button>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 7: Run TypeScript type check**
```bash
cd C:\church-community\frontend && npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 8: Commit**
```bash
git add frontend/src/app/admin/users/page.tsx
git commit -m "feat: admin users — CHURCH_MANAGER church assignment modal + role labels fix"
```

---

### Task 6: Frontend — Admin 행사 EventCategory + 교회; 공간/물품 CHURCH_MANAGER 처리

**Files:**
- Modify: `frontend/src/app/admin/events/page.tsx`
- Modify: `frontend/src/app/admin/spaces/page.tsx`
- Modify: `frontend/src/app/admin/items/page.tsx`

**Context:**

**Events page (`admin/events/page.tsx`):**
- `EMPTY_FORM` has no `category` or `churchId` fields — form sends neither to backend
- After Task 4 backend, `EventDto.Response` returns `category` and `churchId`/`churchName`
- SUPER_ADMIN creating events can optionally pick a church; CHURCH_MANAGER's church is auto-set by backend (no dropdown needed)
- `Event` type in `@/types` may or may not include `category`, `churchId` — cast with `as unknown as {...}` if needed

**Spaces page (`admin/spaces/page.tsx`):**
- Form has `<select required>` for church — must be conditionally hidden for CHURCH_MANAGER
- `handleSave` always includes `churchId` — must conditionally omit it for CHURCH_MANAGER
- `useAuthStore` provides `me.role`

**Items page (`admin/items/page.tsx`):**
- Same issue as spaces — church dropdown must be hidden for CHURCH_MANAGER

**Produces:**
- Events admin form: category dropdown (required) + optional church dropdown (SUPER_ADMIN only)
- Events table: category badge column
- Spaces/items admin form: church dropdown hidden when `me?.role === 'CHURCH_MANAGER'`

---

**Admin Events Page:**

- [ ] **Step 1: Update `admin/events/page.tsx` imports and add state**

Add import at top:
```tsx
import { useAuthStore } from '@/store/authStore';
```

Inside component, add:
```tsx
const { user: me } = useAuthStore();
const [churches, setChurches] = useState<{ id: number; name: string }[]>([]);
```

Update `useEffect` to also fetch churches when SUPER_ADMIN:
```tsx
useEffect(() => {
  fetchEvents();
  if (me?.role === 'SUPER_ADMIN') {
    api.get('/churches').then(r => setChurches(r.data.data ?? []));
  }
}, []);
```

- [ ] **Step 2: Update `EMPTY_FORM` and `openEdit` to include category + churchId**

```tsx
const EMPTY_FORM = {
  title: '', description: '', location: '',
  startDate: '', endDate: '', maxParticipants: '', thumbnailUrl: '',
  status: 'DRAFT', category: 'CHURCH', churchId: '',
};
```

Update `openEdit`:
```tsx
const openEdit = (e: Event) => {
  setEditId(e.id);
  setForm({
    title: e.title,
    description: e.description,
    location: e.location,
    startDate: e.startDate.slice(0, 16),
    endDate: e.endDate.slice(0, 16),
    maxParticipants: e.maxParticipants?.toString() ?? '',
    thumbnailUrl: e.thumbnailUrl ?? '',
    status: e.status,
    category: (e as unknown as { category?: string }).category ?? 'CHURCH',
    churchId: (e as unknown as { churchId?: number }).churchId?.toString() ?? '',
  });
  setShowForm(true);
};
```

Update `handleSave` body:
```tsx
const body = {
  ...form,
  maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : null,
  churchId: form.churchId ? Number(form.churchId) : null,
};
```

- [ ] **Step 3: Add category label map and category badge in events table**

Add at top of file (near other label maps):
```tsx
const CATEGORY_LABEL: Record<string, string> = {
  NEIGHBORHOOD: '동네소식', FAITH: '신앙', SERVICE: '봉사',
  CHURCH: '교회', WELCOME_TABLE: '환영밥상',
};
```

Add `카테고리` column header in `<thead>`:
```tsx
<th className="px-4 py-3 text-left text-xs font-bold text-gray-500">카테고리</th>
```

Add category cell in each `<tr>` (before or after 상태 column):
```tsx
<td className="px-4 py-3">
  <span className="text-xs px-2 py-0.5 bg-blue-50 text-[#003478] rounded-full">
    {CATEGORY_LABEL[(e as unknown as { category?: string }).category ?? ''] ?? '-'}
  </span>
</td>
```

- [ ] **Step 4: Add category dropdown to events form (before status dropdown)**

In the form, add a new field block before the status `<select>`:
```tsx
<div>
  <label className="block text-xs font-semibold text-gray-700 mb-1">카테고리</label>
  <select
    value={form.category}
    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]"
  >
    <option value="NEIGHBORHOOD">동네소식</option>
    <option value="FAITH">신앙</option>
    <option value="SERVICE">봉사</option>
    <option value="CHURCH">교회</option>
    <option value="WELCOME_TABLE">환영밥상</option>
  </select>
</div>
```

- [ ] **Step 5: Add church dropdown for SUPER_ADMIN only (after category)**

```tsx
{me?.role === 'SUPER_ADMIN' && (
  <div>
    <label className="block text-xs font-semibold text-gray-700 mb-1">교회 (선택)</label>
    <select
      value={form.churchId}
      onChange={(e) => setForm((f) => ({ ...f, churchId: e.target.value }))}
      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]"
    >
      <option value="">교회 선택 안함</option>
      {churches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
    </select>
  </div>
)}
```

---

**Admin Spaces Page:**

- [ ] **Step 6: Update `admin/spaces/page.tsx` — hide church dropdown for CHURCH_MANAGER**

Add import and state:
```tsx
import { useAuthStore } from '@/store/authStore';
// inside component:
const { user: me } = useAuthStore();
```

Wrap the church `<select>` field with a conditional (replace the existing church field block):
```tsx
{me?.role !== 'CHURCH_MANAGER' && (
  <div>
    <label className="block text-xs font-semibold text-gray-700 mb-1">교회 *</label>
    <select
      required={me?.role !== 'CHURCH_MANAGER'}
      value={form.churchId}
      onChange={e => setForm(p => ({ ...p, churchId: e.target.value }))}
      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]"
    >
      <option value="">교회 선택</option>
      {churches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
    </select>
  </div>
)}
```

Update `handleSave` to conditionally include `churchId`:
```tsx
const handleSave = async (e: React.FormEvent) => {
  e.preventDefault();
  const body: Record<string, unknown> = {
    name: form.name,
    description: form.description || null,
    usageTypes: form.usageTypes || null,
    capacity: form.capacity ? Number(form.capacity) : null,
    available: form.available,
  };
  if (me?.role !== 'CHURCH_MANAGER') {
    body.churchId = form.churchId ? Number(form.churchId) : null;
  }
  if (editId) {
    await api.put(`/admin/spaces/${editId}`, body);
  } else {
    await api.post('/admin/spaces', body);
  }
  setShowForm(false);
  fetchAll();
};
```

---

**Admin Items Page:**

- [ ] **Step 7: Update `admin/items/page.tsx` — hide church dropdown for CHURCH_MANAGER**

Add import and state:
```tsx
import { useAuthStore } from '@/store/authStore';
// inside component:
const { user: me } = useAuthStore();
```

Wrap church `<select>` with conditional (replace existing church field block):
```tsx
{me?.role !== 'CHURCH_MANAGER' && (
  <div>
    <label className="block text-xs font-semibold text-gray-700 mb-1">교회</label>
    <select
      value={form.churchId}
      onChange={e => setForm(p => ({ ...p, churchId: e.target.value }))}
      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]"
    >
      <option value="">교회 선택 (선택사항)</option>
      {churches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
    </select>
  </div>
)}
```

Update `handleSave` body:
```tsx
const handleSave = async (e: React.FormEvent) => {
  e.preventDefault();
  const body: Record<string, unknown> = {
    name: form.name,
    description: form.description || null,
    category: form.category,
    totalQuantity: Number(form.totalQuantity),
  };
  if (me?.role !== 'CHURCH_MANAGER') {
    body.churchId = form.churchId ? Number(form.churchId) : null;
  }
  if (editId) {
    await api.put(`/admin/items/${editId}`, body);
  } else {
    await api.post('/admin/items', body);
  }
  setShowForm(false);
  fetchAll();
};
```

- [ ] **Step 8: Run TypeScript type check**
```bash
cd C:\church-community\frontend && npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 9: Commit**
```bash
git add frontend/src/app/admin/events/page.tsx \
         frontend/src/app/admin/spaces/page.tsx \
         frontend/src/app/admin/items/page.tsx
git commit -m "feat: admin events category+church; hide church dropdown for CHURCH_MANAGER in spaces/items"
```
