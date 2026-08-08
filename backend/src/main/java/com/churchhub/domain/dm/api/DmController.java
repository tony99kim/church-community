package com.churchhub.domain.dm.api;

import com.churchhub.common.response.ApiResponse;
import com.churchhub.domain.dm.dto.DmDto;
import com.churchhub.domain.dm.service.DmService;
import com.churchhub.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/conversations")
@RequiredArgsConstructor
public class DmController {

    private final DmService dmService;

    @GetMapping
    public ApiResponse<List<DmDto.ConversationResponse>> listMyConversations(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(dmService.listMyConversations(userDetails.getUserId()));
    }

    @PostMapping
    public ApiResponse<DmDto.ConversationResponse> startConversation(
            @Valid @RequestBody DmDto.StartRequest req,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(dmService.startConversation(userDetails.getUserId(), req));
    }

    @GetMapping("/{id}/messages")
    public ApiResponse<List<DmDto.MessageResponse>> getMessages(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(dmService.getMessages(id, userDetails.getUserId()));
    }

    @PostMapping("/{id}/messages")
    public ApiResponse<DmDto.MessageResponse> sendMessage(
            @PathVariable Long id,
            @Valid @RequestBody DmDto.SendRequest req,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(dmService.sendMessage(id, userDetails.getUserId(), req.getContent()));
    }

    @GetMapping("/unread-count")
    public ApiResponse<DmDto.UnreadCountResponse> getUnreadCount(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(dmService.getUnreadCount(userDetails.getUserId()));
    }
}
