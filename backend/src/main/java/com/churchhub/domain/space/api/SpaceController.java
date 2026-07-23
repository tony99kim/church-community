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
