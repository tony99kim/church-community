package com.churchhub.domain.event.api;

import com.churchhub.common.response.ApiResponse;
import com.churchhub.domain.event.dto.EventDto;
import com.churchhub.domain.event.service.EventService;
import com.churchhub.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "행사", description = "행사 API")
@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @Operation(summary = "행사 목록 조회")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<EventDto.Response>>> getEvents(
            @PageableDefault(size = 10, sort = "startDate", direction = Sort.Direction.ASC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(eventService.getEvents(pageable)));
    }

    @Operation(summary = "행사 상세 조회")
    @GetMapping("/{eventId}")
    public ResponseEntity<ApiResponse<EventDto.Response>> getEvent(
            @PathVariable Long eventId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = userDetails != null ? userDetails.getUserId() : null;
        return ResponseEntity.ok(ApiResponse.success(eventService.getEvent(eventId, userId)));
    }

    @Operation(summary = "행사 참여 신청")
    @PostMapping("/{eventId}/join")
    public ResponseEntity<ApiResponse<Void>> joinEvent(
            @PathVariable Long eventId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        eventService.joinEvent(eventId, userDetails.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("행사 참여 신청이 완료되었습니다.", null));
    }

    @Operation(summary = "행사 참여 취소")
    @DeleteMapping("/{eventId}/join")
    public ResponseEntity<ApiResponse<Void>> cancelJoin(
            @PathVariable Long eventId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        eventService.cancelJoin(eventId, userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success("참여 신청이 취소되었습니다.", null));
    }
}
