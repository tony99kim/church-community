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
