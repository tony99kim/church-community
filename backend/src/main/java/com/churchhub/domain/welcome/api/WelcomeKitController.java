package com.churchhub.domain.welcome.api;

import com.churchhub.common.response.ApiResponse;
import com.churchhub.domain.welcome.dto.WelcomeKitDto;
import com.churchhub.domain.welcome.service.WelcomeKitService;
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
public class WelcomeKitController {

    private final WelcomeKitService welcomeKitService;

    @PostMapping("/welcome/kit")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<WelcomeKitDto.Response> apply(
            @Valid @RequestBody WelcomeKitDto.Request req,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(welcomeKitService.apply(req, userDetails.getUserId()));
    }

    @GetMapping("/welcome/kits/my")
    public ApiResponse<List<WelcomeKitDto.Response>> getMyKits(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(welcomeKitService.getMyKits(userDetails.getUserId()));
    }

    @GetMapping("/admin/welcome/kits")
    @PreAuthorize("hasAnyRole('PASTOR', 'CHURCH_MANAGER', 'SUPER_ADMIN')")
    public ApiResponse<List<WelcomeKitDto.Response>> getAll() {
        return ApiResponse.success(welcomeKitService.getAll());
    }

    @PutMapping("/admin/welcome/kits/{id}/process")
    @PreAuthorize("hasAnyRole('PASTOR', 'CHURCH_MANAGER', 'SUPER_ADMIN')")
    public ApiResponse<WelcomeKitDto.Response> markProcessed(@PathVariable Long id) {
        return ApiResponse.success(welcomeKitService.markProcessed(id));
    }

    @PutMapping("/admin/welcome/kits/{id}/message")
    @PreAuthorize("hasAnyRole('PASTOR', 'CHURCH_MANAGER', 'SUPER_ADMIN')")
    public ApiResponse<WelcomeKitDto.Response> sendMessage(
            @PathVariable Long id,
            @Valid @RequestBody WelcomeKitDto.AdminMessageRequest req) {
        return ApiResponse.success(welcomeKitService.sendAdminMessage(id, req.getAdminMessage()));
    }

    @DeleteMapping("/admin/welcome/kits/{id}")
    @PreAuthorize("hasAnyRole('PASTOR', 'CHURCH_MANAGER', 'SUPER_ADMIN')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        welcomeKitService.delete(id);
        return ApiResponse.success(null);
    }
}
