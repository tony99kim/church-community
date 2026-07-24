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
        itemService.deleteItem(id, userDetails.getUserId());
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
}
