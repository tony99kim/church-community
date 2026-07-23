package com.churchhub.domain.welcome.api;

import com.churchhub.common.response.ApiResponse;
import com.churchhub.domain.welcome.dto.WelcomeKitDto;
import com.churchhub.domain.welcome.service.WelcomeKitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class WelcomeKitController {

    private final WelcomeKitService welcomeKitService;

    @PostMapping("/welcome/kit")
    public ApiResponse<WelcomeKitDto.Response> apply(@Valid @RequestBody WelcomeKitDto.Request req) {
        return ApiResponse.success(welcomeKitService.apply(req));
    }

    @GetMapping("/admin/welcome/kits")
    @PreAuthorize("hasAnyRole('CHURCH_MANAGER', 'SUPER_ADMIN')")
    public ApiResponse<List<WelcomeKitDto.Response>> getAll() {
        return ApiResponse.success(welcomeKitService.getAll());
    }

    @PutMapping("/admin/welcome/kits/{id}/process")
    @PreAuthorize("hasAnyRole('CHURCH_MANAGER', 'SUPER_ADMIN')")
    public ApiResponse<WelcomeKitDto.Response> markProcessed(@PathVariable Long id) {
        return ApiResponse.success(welcomeKitService.markProcessed(id));
    }
}
