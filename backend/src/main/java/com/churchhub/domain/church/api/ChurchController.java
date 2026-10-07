package com.churchhub.domain.church.api;

import com.churchhub.security.access.ChurchManagerOrSuperAdmin;
import com.churchhub.security.access.SuperAdminOnly;
import com.churchhub.common.response.ApiResponse;
import com.churchhub.domain.church.dto.ChurchDto;
import com.churchhub.domain.church.service.ChurchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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

    @GetMapping("/admin/churches")
    @ChurchManagerOrSuperAdmin
    public ApiResponse<List<ChurchDto.Response>> getAllChurches() {
        return ApiResponse.success(churchService.getAllChurches());
    }

    @GetMapping("/churches/{id}")
    public ApiResponse<ChurchDto.Response> getChurch(@PathVariable Long id) {
        return ApiResponse.success(churchService.getChurch(id));
    }

    @PostMapping("/admin/churches")
    @SuperAdminOnly
    public ApiResponse<ChurchDto.Response> createChurch(@Valid @RequestBody ChurchDto.CreateRequest req) {
        return ApiResponse.success(churchService.createChurch(req));
    }

    @PutMapping("/admin/churches/{id}")
    @ChurchManagerOrSuperAdmin
    public ApiResponse<ChurchDto.Response> updateChurch(@PathVariable Long id,
                                                         @Valid @RequestBody ChurchDto.UpdateRequest req) {
        return ApiResponse.success(churchService.updateChurch(id, req));
    }

    @DeleteMapping("/admin/churches/{id}")
    @SuperAdminOnly
    public ApiResponse<Void> deleteChurch(@PathVariable Long id) {
        churchService.deleteChurch(id);
        return ApiResponse.success(null);
    }
}
