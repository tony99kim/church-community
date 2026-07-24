# Space Calendar Booking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 공간 대여를 달력 기반 슬롯 예약 시스템으로 재설계 — 교회별 공간 그룹화, 날짜·시간대 슬롯 선택, 선착순 잠금, 관리자 예약 현황 뷰.

**Architecture:** 공간마다 openTime/closeTime/slotMinutes를 설정해 서버가 슬롯 목록을 계산해 반환한다. 신청 시 PENDING 상태로 즉시 슬롯 잠금 (`SELECT FOR UPDATE`로 동시 신청 방지). 취소/거절 시 슬롯 자동 해제. 프론트는 달력→날짜 선택→슬롯 그리드→모달 흐름으로 구현한다.

**Tech Stack:** Spring Boot 3.2.5 / JPA / PostgreSQL / Flyway V6 | Next.js 14 App Router / TypeScript / Tailwind

## Global Constraints

- 백엔드 패키지 루트: `com.churchhub`
- 빌드: `JAVA_HOME="/c/Users/taeyeop/.jdks/graalvm-jdk-21.0.7" ./gradlew compileJava` (backend 디렉토리)
- API prefix: `/api/v1/`, 응답 wrapper: `ApiResponse<T>`
- 디자인 토큰: `#003478` (파랑), `#EDEFF1` (보더), `#f4f6f8` (배경)
- Flyway 다음 버전: V6 (V5까지 존재)
- 기존 SpaceRental status enum: `PENDING, APPROVED, REJECTED, CANCELLED`
- PENDING/APPROVED 상태 예약 = 슬롯 잠금. REJECTED/CANCELLED = 슬롯 해제.
- 슬롯 충돌 체크는 반드시 `@Transactional` + `@Lock(PESSIMISTIC_WRITE)` 사용
- 공개 GET `/spaces`, `/spaces/{id}` — 인증 불필요
- `/spaces/{id}/slots` — 인증 불필요 (조회), MY_PENDING/MY_APPROVED는 로그인 시만 표시
- `/spaces/{id}/rentals` (POST) — 인증 필요 (기존 유지)

---

## 파일 변경 맵

### 백엔드 (신규/수정)
| 파일 | 역할 |
|---|---|
| `db/migration/V6__add_space_slots.sql` | spaces 테이블에 open_time, close_time, slot_minutes 추가 |
| `space/entity/Space.java` | openTime, closeTime, slotMinutes 필드 추가 + Builder 갱신 |
| `space/entity/SpaceRental.java` | `cancel()` 메서드 추가 |
| `space/dto/SpaceDto.java` | CreateRequest/UpdateRequest에 시간 필드 추가, SlotResponse 신규 inner class |
| `space/repository/SpaceRentalRepository.java` | 슬롯 충돌 체크 쿼리 추가 (PESSIMISTIC_WRITE) |
| `space/service/SpaceService.java` | applyRental에 충돌 체크 추가, cancelRental 추가, getSlots 추가 |
| `space/api/SpaceController.java` | `GET /spaces/{id}/slots`, `PUT /spaces/rentals/{id}/cancel` 추가 |

### 프론트엔드 (수정)
| 파일 | 역할 |
|---|---|
| `src/types/index.ts` | Space에 openTime/closeTime/slotMinutes 추가, SlotInfo 타입 추가 |
| `src/app/(site)/spaces/page.tsx` | 교회별 공간 그룹화 레이아웃으로 교체 |
| `src/app/(site)/spaces/[id]/page.tsx` | 달력 + 슬롯 그리드 + 신청 모달로 전면 교체 |
| `src/app/admin/spaces/page.tsx` | "예약 현황" 탭 추가: 날짜 선택 → 예약 목록 + 승인/거절 |

---

## Task 1: Backend — V6 migration + Space 엔티티 슬롯 설정 필드

**Files:**
- Create: `backend/src/main/resources/db/migration/V6__add_space_slots.sql`
- Modify: `backend/src/main/java/com/churchhub/domain/space/entity/Space.java`
- Modify: `backend/src/main/java/com/churchhub/domain/space/dto/SpaceDto.java`

**Interfaces:**
- Produces: `Space.openTime` (`LocalTime`), `Space.closeTime` (`LocalTime`), `Space.slotMinutes` (`int`, default 60)
- Produces: `SpaceDto.Response`에 `openTime`, `closeTime`, `slotMinutes` 노출
- Produces: `SpaceDto.CreateRequest`/`UpdateRequest`에 이 세 필드 추가

- [ ] **Step 1: V6 migration 파일 작성**

파일: `backend/src/main/resources/db/migration/V6__add_space_slots.sql`
```sql
ALTER TABLE spaces ADD COLUMN open_time TIME NOT NULL DEFAULT '09:00';
ALTER TABLE spaces ADD COLUMN close_time TIME NOT NULL DEFAULT '21:00';
ALTER TABLE spaces ADD COLUMN slot_minutes INT NOT NULL DEFAULT 60;
```

- [ ] **Step 2: Space 엔티티에 필드 추가**

`Space.java`에 다음 import 추가:
```java
import java.time.LocalTime;
```

기존 `private boolean available = true;` 아래에 추가:
```java
@Column(nullable = false)
private LocalTime openTime = LocalTime.of(9, 0);

@Column(nullable = false)
private LocalTime closeTime = LocalTime.of(21, 0);

@Column(nullable = false)
private int slotMinutes = 60;
```

Builder 생성자를 다음으로 교체:
```java
@Builder
public Space(Church church, String name, String description, String usageTypes,
             Integer capacity, LocalTime openTime, LocalTime closeTime, int slotMinutes) {
    this.church = church;
    this.name = name;
    this.description = description;
    this.usageTypes = usageTypes;
    this.capacity = capacity;
    if (openTime != null) this.openTime = openTime;
    if (closeTime != null) this.closeTime = closeTime;
    if (slotMinutes > 0) this.slotMinutes = slotMinutes;
}
```

`update()` 메서드를 다음으로 교체:
```java
public void update(String name, String description, String usageTypes, Integer capacity,
                   boolean available, LocalTime openTime, LocalTime closeTime, int slotMinutes) {
    this.name = name;
    this.description = description;
    this.usageTypes = usageTypes;
    this.capacity = capacity;
    this.available = available;
    if (openTime != null) this.openTime = openTime;
    if (closeTime != null) this.closeTime = closeTime;
    if (slotMinutes > 0) this.slotMinutes = slotMinutes;
}
```

- [ ] **Step 3: SpaceDto 수정**

`SpaceDto.java` import에 추가:
```java
import java.time.LocalTime;
```

`Response` inner class의 `from(Space s)` 메서드와 필드에 다음 추가:
```java
private LocalTime openTime;
private LocalTime closeTime;
private int slotMinutes;
```

`from()` 메서드 내에 빌더에 추가:
```java
.openTime(s.getOpenTime())
.closeTime(s.getCloseTime())
.slotMinutes(s.getSlotMinutes())
```

`CreateRequest`에 추가:
```java
private LocalTime openTime;
private LocalTime closeTime;
private int slotMinutes = 60;
```

`UpdateRequest`에 추가:
```java
private LocalTime openTime;
private LocalTime closeTime;
private int slotMinutes = 60;
```

- [ ] **Step 4: SpaceService의 createSpace/updateSpace 빌더 수정**

`createSpace(SpaceDto.CreateRequest req, Long callerId)` 내 `Space.builder()` 호출에 추가:
```java
Space space = Space.builder()
        .church(church).name(req.getName()).description(req.getDescription())
        .usageTypes(req.getUsageTypes()).capacity(req.getCapacity())
        .openTime(req.getOpenTime()).closeTime(req.getCloseTime()).slotMinutes(req.getSlotMinutes())
        .build();
```

`updateSpace()` 내 `space.update()` 호출을 다음으로 교체:
```java
space.update(req.getName(), req.getDescription(), req.getUsageTypes(), req.getCapacity(),
        req.isAvailable(), req.getOpenTime(), req.getCloseTime(), req.getSlotMinutes());
```

- [ ] **Step 5: 빌드 확인**

```
cd C:\church-community\backend
JAVA_HOME="/c/Users/taeyeop/.jdks/graalvm-jdk-21.0.7" ./gradlew compileJava
```
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 6: 커밋**

```bash
git add backend/src/main/resources/db/migration/V6__add_space_slots.sql \
        backend/src/main/java/com/churchhub/domain/space/entity/Space.java \
        backend/src/main/java/com/churchhub/domain/space/dto/SpaceDto.java \
        backend/src/main/java/com/churchhub/domain/space/service/SpaceService.java
git commit -m "feat: add slot scheduling fields to Space (open_time, close_time, slot_minutes)"
```

---

## Task 2: Backend — 슬롯 조회 API + 선착순 잠금 신청 로직

**Files:**
- Modify: `backend/src/main/java/com/churchhub/domain/space/entity/SpaceRental.java`
- Modify: `backend/src/main/java/com/churchhub/domain/space/repository/SpaceRentalRepository.java`
- Modify: `backend/src/main/java/com/churchhub/domain/space/dto/SpaceDto.java`
- Modify: `backend/src/main/java/com/churchhub/domain/space/service/SpaceService.java`
- Modify: `backend/src/main/java/com/churchhub/domain/space/api/SpaceController.java`

**Interfaces:**
- Consumes: `Space.openTime`, `Space.closeTime`, `Space.slotMinutes` (Task 1)
- Produces: `GET /spaces/{id}/slots?date=YYYY-MM-DD` → `ApiResponse<List<SpaceDto.SlotResponse>>`
- Produces: `PUT /spaces/rentals/{id}/cancel` → `ApiResponse<SpaceDto.RentalResponse>`
- Produces: `SlotResponse { startTime, endTime, status }` where status is `"AVAILABLE" | "TAKEN" | "MY_PENDING" | "MY_APPROVED"`

- [ ] **Step 1: SpaceRental에 cancel() 추가**

`SpaceRental.java`의 `reject()` 메서드 아래에 추가:
```java
public void cancel() { this.status = RentalStatus.CANCELLED; }
```

- [ ] **Step 2: SpaceRentalRepository에 충돌 체크 쿼리 추가**

`SpaceRentalRepository.java`에 import 추가:
```java
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
```

다음 메서드 추가:
```java
// 선착순 잠금용 — 비관적 락
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT r FROM SpaceRental r WHERE r.space.id = :spaceId " +
       "AND r.status IN (com.churchhub.domain.space.entity.RentalStatus.PENDING, " +
       "com.churchhub.domain.space.entity.RentalStatus.APPROVED) " +
       "AND r.startDateTime < :endTime AND r.endDateTime > :startTime")
List<SpaceRental> findConflicting(@Param("spaceId") Long spaceId,
                                  @Param("startTime") LocalDateTime startTime,
                                  @Param("endTime") LocalDateTime endTime);

// 슬롯 조회용 — 특정 날짜 범위의 예약 목록
@Query("SELECT r FROM SpaceRental r WHERE r.space.id = :spaceId " +
       "AND r.status IN (com.churchhub.domain.space.entity.RentalStatus.PENDING, " +
       "com.churchhub.domain.space.entity.RentalStatus.APPROVED) " +
       "AND r.startDateTime >= :dayStart AND r.startDateTime < :dayEnd")
List<SpaceRental> findActiveBySpaceAndDate(@Param("spaceId") Long spaceId,
                                            @Param("dayStart") LocalDateTime dayStart,
                                            @Param("dayEnd") LocalDateTime dayEnd);
```

- [ ] **Step 3: SpaceDto에 SlotResponse 추가**

`SpaceDto.java`에 import 추가:
```java
import java.time.LocalTime;
```

`SpaceDto` 클래스 안에 새 inner class 추가:
```java
@Getter
@Builder
public static class SlotResponse {
    private LocalTime startTime;
    private LocalTime endTime;
    private String status; // AVAILABLE, TAKEN, MY_PENDING, MY_APPROVED
}
```

- [ ] **Step 4: SpaceService에 getSlots + cancelRental 추가**

`SpaceService.java`에 import 추가:
```java
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
```

`applyRental()` 메서드를 다음으로 **교체**:
```java
@Transactional
public SpaceDto.RentalResponse applyRental(Long spaceId, Long userId, SpaceDto.RentalRequest req) {
    Space space = spaceRepository.findById(spaceId)
            .orElseThrow(() -> new BusinessException(ErrorCode.SPACE_NOT_FOUND));
    if (!space.isAvailable()) throw new BusinessException(ErrorCode.SPACE_NOT_AVAILABLE);
    // 선착순 충돌 체크 (비관적 락)
    List<SpaceRental> conflicts = spaceRentalRepository.findConflicting(
            spaceId, req.getStartDateTime(), req.getEndDateTime());
    if (!conflicts.isEmpty()) throw new BusinessException(ErrorCode.SPACE_SLOT_TAKEN);
    User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    SpaceRental rental = SpaceRental.builder()
            .space(space).applicant(user)
            .startDateTime(req.getStartDateTime()).endDateTime(req.getEndDateTime())
            .headcount(req.getHeadcount()).purpose(req.getPurpose())
            .contactPhone(req.getContactPhone()).build();
    return SpaceDto.RentalResponse.from(spaceRentalRepository.save(rental));
}
```

`applyRental()` 아래에 추가:
```java
@Transactional
public SpaceDto.RentalResponse cancelRental(Long rentalId, Long callerId) {
    SpaceRental rental = spaceRentalRepository.findById(rentalId)
            .orElseThrow(() -> new BusinessException(ErrorCode.SPACE_RENTAL_NOT_FOUND));
    User caller = getCallerUser(callerId);
    if (!rental.getApplicant().getId().equals(caller.getId())) {
        throw new BusinessException(ErrorCode.FORBIDDEN);
    }
    if (rental.getStatus() == RentalStatus.APPROVED) {
        throw new BusinessException(ErrorCode.SPACE_RENTAL_ALREADY_APPROVED);
    }
    rental.cancel();
    return SpaceDto.RentalResponse.from(rental);
}

public List<SpaceDto.SlotResponse> getSlots(Long spaceId, LocalDate date, Long callerId) {
    Space space = spaceRepository.findById(spaceId)
            .orElseThrow(() -> new BusinessException(ErrorCode.SPACE_NOT_FOUND));
    LocalDateTime dayStart = date.atStartOfDay();
    LocalDateTime dayEnd = date.plusDays(1).atStartOfDay();
    List<SpaceRental> activeRentals = spaceRentalRepository.findActiveBySpaceAndDate(spaceId, dayStart, dayEnd);

    List<SpaceDto.SlotResponse> slots = new ArrayList<>();
    LocalTime cursor = space.getOpenTime();
    while (cursor.plusMinutes(space.getSlotMinutes()).compareTo(space.getCloseTime()) <= 0) {
        LocalTime slotEnd = cursor.plusMinutes(space.getSlotMinutes());
        LocalDateTime slotStart = date.atTime(cursor);
        LocalDateTime slotEndDt = date.atTime(slotEnd);

        String status = "AVAILABLE";
        for (SpaceRental r : activeRentals) {
            if (r.getStartDateTime().isBefore(slotEndDt) && r.getEndDateTime().isAfter(slotStart)) {
                if (callerId != null && r.getApplicant().getId().equals(callerId)) {
                    status = r.getStatus().name().equals("PENDING") ? "MY_PENDING" : "MY_APPROVED";
                } else {
                    status = "TAKEN";
                }
                break;
            }
        }
        slots.add(SpaceDto.SlotResponse.builder()
                .startTime(cursor).endTime(slotEnd).status(status).build());
        cursor = slotEnd;
    }
    return slots;
}
```

주의: `getSlots`에서 `callerId`가 null일 수 있으므로 반드시 null 체크. `activeRentals`는 `findActiveBySpaceAndDate`로 조회 — 이 메서드는 비관적 락이 아닌 일반 조회.

- [ ] **Step 5: ErrorCode에 신규 에러코드 추가**

`ErrorCode.java`의 Space 섹션에 추가:
```java
SPACE_SLOT_TAKEN(HttpStatus.CONFLICT, "이미 예약된 시간대입니다."),
SPACE_RENTAL_ALREADY_APPROVED(HttpStatus.BAD_REQUEST, "승인된 예약은 취소할 수 없습니다."),
```

- [ ] **Step 6: SpaceController에 엔드포인트 추가**

`SpaceController.java`에 import 추가:
```java
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import java.util.List;
```

기존 `applyRental` 엔드포인트 아래에 추가:
```java
@GetMapping("/spaces/{id}/slots")
public ApiResponse<List<SpaceDto.SlotResponse>> getSlots(
        @PathVariable Long id,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
        @AuthenticationPrincipal CustomUserDetails userDetails) {
    Long callerId = userDetails != null ? userDetails.getUserId() : null;
    return ApiResponse.success(spaceService.getSlots(id, date, callerId));
}

@PutMapping("/spaces/rentals/{rentalId}/cancel")
public ApiResponse<SpaceDto.RentalResponse> cancelRental(
        @PathVariable Long rentalId,
        @AuthenticationPrincipal CustomUserDetails userDetails) {
    return ApiResponse.success(spaceService.cancelRental(rentalId, userDetails.getUserId()));
}
```

`GET /spaces/{id}/slots`는 인증 없이도 호출 가능해야 하므로 `SecurityConfig`에서 해당 패턴을 공개 처리. 기존 `/api/v1/spaces/**` GET 공개 설정이 있는지 확인:
```
grep -n "spaces" backend/src/main/java/com/churchhub/config/SecurityConfig.java
```
이미 공개되어 있다면 추가 불필요.

- [ ] **Step 7: 빌드 확인**

```
cd C:\church-community\backend
JAVA_HOME="/c/Users/taeyeop/.jdks/graalvm-jdk-21.0.7" ./gradlew compileJava
```
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 8: 커밋**

```bash
git add backend/src/main/java/com/churchhub/domain/space/entity/SpaceRental.java \
        backend/src/main/java/com/churchhub/domain/space/repository/SpaceRentalRepository.java \
        backend/src/main/java/com/churchhub/domain/space/dto/SpaceDto.java \
        backend/src/main/java/com/churchhub/domain/space/service/SpaceService.java \
        backend/src/main/java/com/churchhub/domain/space/api/SpaceController.java \
        backend/src/main/java/com/churchhub/exception/ErrorCode.java
git commit -m "feat: slot-based space booking — conflict lock, getSlots API, cancelRental"
```

---

## Task 3: Frontend — 타입 업데이트 + /spaces 교회별 그룹화

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/app/(site)/spaces/page.tsx`

**Interfaces:**
- Consumes: `Space.openTime`, `Space.closeTime`, `Space.slotMinutes` (Task 1 백엔드)
- Produces: `Space` 타입에 슬롯 필드 추가, `SlotInfo` 타입 신규

- [ ] **Step 1: types/index.ts — Space에 슬롯 필드 추가 + SlotInfo 타입 추가**

`Space` interface에 추가:
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
  openTime: string;    // "HH:mm:ss"
  closeTime: string;   // "HH:mm:ss"
  slotMinutes: number;
}
```

파일 어딘가(RentalStatus 아래 등)에 추가:
```typescript
export interface SlotInfo {
  startTime: string;  // "HH:mm:ss"
  endTime: string;    // "HH:mm:ss"
  status: 'AVAILABLE' | 'TAKEN' | 'MY_PENDING' | 'MY_APPROVED';
}
```

- [ ] **Step 2: /spaces/page.tsx — 교회별 그룹화 레이아웃으로 교체**

파일 전체를 다음으로 교체:
```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Space } from '@/types';
import { useAuthStore } from '@/store/authStore';

export default function SpacesPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const { isLoggedIn } = useAuthStore();

  useEffect(() => {
    api.get('/spaces').then(r => setSpaces(r.data.data ?? [])).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">불러오는 중...</div>;

  // 교회별 그룹화
  const grouped = spaces.reduce<Record<string, Space[]>>((acc, s) => {
    const key = s.churchName ?? '기타';
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-[#f4f6f8] py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[#003478] mb-2">공간 대여 🏠</h1>
        <p className="text-gray-500 text-sm mb-6">날짜와 시간대를 선택해 바로 예약하세요. 담당자 확인 후 최종 승인됩니다.</p>

        {!isLoggedIn && (
          <p className="text-sm text-amber-600 mb-6">※ 예약하려면 <Link href="/login" className="underline">로그인</Link>이 필요합니다.</p>
        )}

        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-20 text-gray-400">등록된 공간이 없습니다.</div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([churchName, churchSpaces]) => (
              <section key={churchName}>
                <h2 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="text-[#003478]">⛪</span> {churchName}
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {churchSpaces.map(space => (
                    <div key={space.id} className="bg-white rounded-2xl border border-[#EDEFF1] p-5">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-base font-bold text-gray-800">{space.name}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${space.available ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                          {space.available ? '예약 가능' : '예약 불가'}
                        </span>
                      </div>
                      {space.description && <p className="text-sm text-gray-500 mb-3">{space.description}</p>}
                      <div className="text-xs text-gray-400 space-y-0.5 mb-4">
                        {space.usageTypes && <div>✅ {space.usageTypes}</div>}
                        {space.capacity && <div>👥 최대 {space.capacity}명</div>}
                        <div>🕐 {space.openTime?.slice(0,5)} ~ {space.closeTime?.slice(0,5)} ({space.slotMinutes}분 단위)</div>
                      </div>
                      {space.available && (
                        <Link href={`/spaces/${space.id}`}
                          className="block text-center py-2 bg-[#003478] text-white rounded-xl text-sm font-medium hover:bg-blue-900 transition-colors">
                          {isLoggedIn ? '날짜 선택하기' : '로그인 후 예약'}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 3: TypeScript 체크**

```
cd C:\church-community\frontend && npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 4: 커밋**

```bash
git add frontend/src/types/index.ts frontend/src/app/\(site\)/spaces/page.tsx
git commit -m "feat: spaces page — church-grouped layout, slot schedule display"
```

---

## Task 4: Frontend — /spaces/[id] 달력 + 슬롯 예약 UI

**Files:**
- Modify: `frontend/src/app/(site)/spaces/[id]/page.tsx`

**Interfaces:**
- Consumes: `GET /spaces/{id}` (기존) — Space 상세
- Consumes: `GET /spaces/{id}/slots?date=YYYY-MM-DD` — SlotInfo[] (Task 2)
- Consumes: `POST /spaces/{id}/rentals` (기존) — 예약 신청
- Produces: 달력 → 날짜 선택 → 슬롯 그리드 → 신청 모달 UI

슬롯 상태별 색상:
- `AVAILABLE`: 초록 (`bg-green-50 text-green-700 border-green-200 cursor-pointer hover:bg-green-100`)
- `TAKEN`: 회색 (`bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed`)
- `MY_PENDING`: 노랑 (`bg-amber-50 text-amber-700 border-amber-200`)
- `MY_APPROVED`: 파랑 (`bg-blue-50 text-[#003478] border-[#003478]`)

- [ ] **Step 1: /spaces/[id]/page.tsx 전면 교체**

파일 전체를 다음으로 교체:
```tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Space, SlotInfo } from '@/types';
import { useAuthStore } from '@/store/authStore';

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { firstDay, daysInMonth };
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const slotStyle: Record<string, string> = {
  AVAILABLE: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 cursor-pointer',
  TAKEN: 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed',
  MY_PENDING: 'bg-amber-50 text-amber-700 border-amber-200 cursor-default',
  MY_APPROVED: 'bg-blue-50 text-[#003478] border-[#003478] cursor-default',
};

const slotLabel: Record<string, string> = {
  AVAILABLE: '예약 가능',
  TAKEN: '마감',
  MY_PENDING: '대기중',
  MY_APPROVED: '승인됨',
};

export default function SpaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();

  const [space, setSpace] = useState<Space | null>(null);
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [loadingSlots, setLoadingSlots] = useState(false);

  // 신청 모달 상태
  const [pendingSlot, setPendingSlot] = useState<SlotInfo | null>(null);
  const [form, setForm] = useState({ headcount: '', purpose: '', contactPhone: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/spaces/${id}`).then(r => setSpace(r.data.data));
  }, [id]);

  useEffect(() => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    api.get(`/spaces/${id}/slots?date=${selectedDate}`)
      .then(r => setSlots(r.data.data ?? []))
      .finally(() => setLoadingSlots(false));
  }, [id, selectedDate]);

  const handleDayClick = (day: number) => {
    const dateStr = toDateStr(calYear, calMonth, day);
    const today = new Date().toISOString().slice(0, 10);
    if (dateStr < today) return; // 과거 날짜 선택 불가
    setSelectedDate(dateStr);
    setSlots([]);
  };

  const handleSlotClick = (slot: SlotInfo) => {
    if (slot.status !== 'AVAILABLE') return;
    if (!isLoggedIn) { router.push('/login'); return; }
    setPendingSlot(slot);
    setForm({ headcount: '', purpose: '', contactPhone: '' });
  };

  const handleSubmit = async () => {
    if (!pendingSlot || !selectedDate) return;
    setSubmitting(true);
    try {
      await api.post(`/spaces/${id}/rentals`, {
        startDateTime: `${selectedDate}T${pendingSlot.startTime.slice(0, 5)}`,
        endDateTime: `${selectedDate}T${pendingSlot.endTime.slice(0, 5)}`,
        headcount: form.headcount ? Number(form.headcount) : null,
        purpose: form.purpose,
        contactPhone: form.contactPhone,
      });
      alert('예약 신청이 완료되었습니다! 담당자 승인 후 확정됩니다.');
      setPendingSlot(null);
      // 슬롯 새로고침
      const r = await api.get(`/spaces/${id}/slots?date=${selectedDate}`);
      setSlots(r.data.data ?? []);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? '예약 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const { firstDay, daysInMonth } = getMonthDays(calYear, calMonth);
  const today = new Date().toISOString().slice(0, 10);

  if (!space) return <div className="min-h-screen flex items-center justify-center text-gray-400">불러오는 중...</div>;

  return (
    <main className="min-h-screen bg-[#f4f6f8] py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* 공간 정보 */}
        <div className="bg-white rounded-2xl border border-[#EDEFF1] p-5 mb-6">
          <div className="flex items-start justify-between mb-1">
            <h1 className="text-xl font-bold text-gray-900">{space.name}</h1>
            <span className={`px-2 py-0.5 text-xs rounded-full ${space.available ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
              {space.available ? '예약 가능' : '예약 불가'}
            </span>
          </div>
          {space.churchName && <p className="text-xs text-gray-400 mb-2">⛪ {space.churchName}</p>}
          {space.description && <p className="text-sm text-gray-600 mb-2">{space.description}</p>}
          <div className="text-xs text-gray-400 flex gap-4 flex-wrap">
            {space.capacity && <span>👥 최대 {space.capacity}명</span>}
            <span>🕐 {space.openTime?.slice(0,5)} ~ {space.closeTime?.slice(0,5)}</span>
            <span>⏱ {space.slotMinutes}분 단위</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 달력 */}
          <div className="bg-white rounded-2xl border border-[#EDEFF1] p-5">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => { if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); } else setCalMonth(m => m - 1); }}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500">‹</button>
              <span className="font-semibold text-gray-800">{calYear}년 {calMonth + 1}월</span>
              <button onClick={() => { if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); } else setCalMonth(m => m + 1); }}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500">›</button>
            </div>
            <div className="grid grid-cols-7 text-center text-xs text-gray-400 mb-2">
              {['일','월','화','수','목','금','토'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 text-center text-sm gap-y-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const dateStr = toDateStr(calYear, calMonth, day);
                const isPast = dateStr < today;
                const isSelected = dateStr === selectedDate;
                return (
                  <button key={day} disabled={isPast || !space.available}
                    onClick={() => handleDayClick(day)}
                    className={`w-8 h-8 mx-auto rounded-full text-xs font-medium transition-colors
                      ${isPast ? 'text-gray-300 cursor-not-allowed' : ''}
                      ${isSelected ? 'bg-[#003478] text-white' : !isPast ? 'hover:bg-blue-50 text-gray-700' : ''}
                    `}>
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 슬롯 그리드 */}
          <div className="bg-white rounded-2xl border border-[#EDEFF1] p-5">
            {!selectedDate ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">← 날짜를 선택하세요</div>
            ) : loadingSlots ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">불러오는 중...</div>
            ) : slots.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">예약 가능한 시간이 없습니다</div>
            ) : (
              <>
                <p className="text-sm font-semibold text-gray-700 mb-3">{selectedDate} 시간대</p>
                <div className="grid grid-cols-2 gap-2">
                  {slots.map(slot => (
                    <button key={slot.startTime}
                      onClick={() => handleSlotClick(slot)}
                      className={`border rounded-xl px-3 py-2 text-xs font-medium transition-colors ${slotStyle[slot.status]}`}>
                      <div>{slot.startTime.slice(0,5)} ~ {slot.endTime.slice(0,5)}</div>
                      <div className="text-[10px] mt-0.5 opacity-70">{slotLabel[slot.status]}</div>
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex gap-3 flex-wrap text-[10px] text-gray-400">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block"/> 예약가능</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300 inline-block"/> 마감</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"/> 내 대기</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#003478] inline-block"/> 내 승인</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 신청 모달 */}
      {pendingSlot && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <h2 className="font-bold text-gray-900 mb-1">예약 신청</h2>
            <p className="text-xs text-gray-500 mb-4">
              {selectedDate} {pendingSlot.startTime.slice(0,5)} ~ {pendingSlot.endTime.slice(0,5)}
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">예상 인원</label>
                <input type="number" min="1" value={form.headcount}
                  onChange={e => setForm(f => ({ ...f, headcount: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]"
                  placeholder="명" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">사용 목적 *</label>
                <textarea required rows={2} value={form.purpose}
                  onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478] resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">연락처 *</label>
                <input value={form.contactPhone}
                  onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]"
                  placeholder="010-0000-0000" />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button type="button" onClick={() => setPendingSlot(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-xl hover:bg-gray-50">취소</button>
              <button type="button" onClick={handleSubmit} disabled={submitting || !form.purpose || !form.contactPhone}
                className="px-4 py-2 text-sm bg-[#003478] text-white rounded-xl font-semibold hover:bg-blue-900 disabled:opacity-50">
                {submitting ? '신청 중...' : '예약 신청'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 2: TypeScript 체크**

```
cd C:\church-community\frontend && npx tsc --noEmit
```
Expected: no errors. 오류 발생 시 타입 캐스팅 수정.

- [ ] **Step 3: 커밋**

```bash
git add frontend/src/app/\(site\)/spaces/\[id\]/page.tsx
git commit -m "feat: space detail — calendar + slot grid booking UI"
```

---

## Task 5: Frontend — Admin 공간 관리 예약 현황 탭 추가

**Files:**
- Modify: `frontend/src/app/admin/spaces/page.tsx`

**Interfaces:**
- Consumes: `GET /admin/spaces/rentals` (기존) — 전체 예약 목록
- Consumes: `PUT /admin/spaces/rentals/{id}/approve` / `reject` (기존)
- Produces: 날짜 선택 → 해당 날짜 예약 목록 + 승인/거절 버튼

- [ ] **Step 1: admin/spaces/page.tsx — 예약 현황 탭 추가**

현재 파일을 읽어 탭 구조를 파악한다. "예약 현황" 탭이 없다면 탭 목록에 추가하고, 해당 탭 패널을 추가한다.

탭에 추가:
```tsx
<button onClick={() => setTab('rentals')}
  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === 'rentals' ? 'bg-[#003478] text-white' : 'bg-white border border-[#EDEFF1] text-gray-600'}`}>
  예약 현황
</button>
```

"예약 현황" 탭 패널 (컴포넌트 상단에 날짜 필터 상태 추가):
```tsx
const [rentalDate, setRentalDate] = useState(new Date().toISOString().slice(0, 10));
```

탭 패널 본문:
```tsx
{tab === 'rentals' && (
  <div>
    <div className="flex items-center gap-3 mb-4">
      <label className="text-sm font-medium text-gray-700">날짜 선택</label>
      <input type="date" value={rentalDate}
        onChange={e => setRentalDate(e.target.value)}
        className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003478]" />
    </div>
    <div className="space-y-2">
      {rentals
        .filter(r => r.startDateTime.startsWith(rentalDate))
        .map(r => (
          <div key={r.id} className="bg-white rounded-xl border border-[#EDEFF1] p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-gray-800 text-sm">{r.spaceName}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {r.startDateTime.slice(11,16)} ~ {r.endDateTime.slice(11,16)} · {r.applicantNickname}
                </p>
                {r.purpose && <p className="text-xs text-gray-400 mt-0.5">목적: {r.purpose}</p>}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  r.status === 'PENDING' ? 'bg-amber-50 text-amber-600' :
                  r.status === 'APPROVED' ? 'bg-green-50 text-green-600' :
                  'bg-gray-100 text-gray-400'}`}>
                  {r.status === 'PENDING' ? '대기' : r.status === 'APPROVED' ? '승인' : r.status === 'REJECTED' ? '거절' : '취소'}
                </span>
                {r.status === 'PENDING' && (
                  <div className="flex gap-1">
                    <button onClick={() => handleApprove(r.id)}
                      className="px-2 py-1 text-xs bg-[#003478] text-white rounded-lg hover:bg-blue-900">승인</button>
                    <button onClick={() => handleReject(r.id)}
                      className="px-2 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600">거절</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      {rentals.filter(r => r.startDateTime.startsWith(rentalDate)).length === 0 && (
        <p className="text-center py-8 text-gray-400 text-sm">해당 날짜에 예약이 없습니다.</p>
      )}
    </div>
  </div>
)}
```

기존 `rentals` 상태와 `handleApprove`/`handleReject` 함수가 이미 있을 경우 그대로 사용. 없다면 기존 탭에서 사용하는 로직 참고해 추가.

- [ ] **Step 2: TypeScript 체크**

```
cd C:\church-community\frontend && npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: 커밋**

```bash
git add frontend/src/app/admin/spaces/page.tsx
git commit -m "feat: admin spaces — rental calendar view with date filter and approve/reject"
```

---

## Self-Review

**Spec coverage:**
- ✅ 공간별 openTime/closeTime/slotMinutes (Task 1)
- ✅ 선착순 슬롯 잠금 — PENDING 즉시 (Task 2 applyRental)
- ✅ 동시 신청 방지 — PESSIMISTIC_WRITE (Task 2)
- ✅ 취소 시 슬롯 해제 — cancel() (Task 2)
- ✅ GET /spaces/{id}/slots API (Task 2)
- ✅ /spaces 교회별 그룹화 (Task 3)
- ✅ /spaces/[id] 달력 + 슬롯 그리드 (Task 4)
- ✅ 관리자 예약 현황 + 승인/거절 (Task 5)

**Placeholder scan:** 없음

**Type consistency:**
- `SlotInfo.startTime` / `SlotInfo.endTime` — 백엔드 `LocalTime` → JSON `"HH:mm:ss"` → 프론트 `.slice(0,5)` 로 `"HH:mm"` 표시. 일관됨.
- `Space.openTime` / `Space.closeTime` — 동일 패턴. 일관됨.
- `cancelRental` → `RentalStatus.CANCELLED` — SpaceRental.cancel()이 Task 2에서 추가됨.
