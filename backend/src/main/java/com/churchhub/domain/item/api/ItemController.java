package com.churchhub.domain.item.api;

import com.churchhub.security.access.AdminOnly;
import com.churchhub.common.response.ApiResponse;
import com.churchhub.domain.item.dto.ItemDto;
import com.churchhub.domain.item.service.ItemService;
import com.churchhub.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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

    @PutMapping("/items/rentals/{rentalId}/cancel")
    public ApiResponse<ItemDto.RentalResponse> cancelRental(
            @PathVariable Long rentalId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(itemService.cancelRental(rentalId, userDetails.getUserId()));
    }

    @GetMapping("/admin/items")
    @AdminOnly
    public ApiResponse<List<ItemDto.Response>> getAdminItems(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(itemService.getAdminItems(userDetails.getUserId()));
    }

    @PostMapping("/admin/items")
    @AdminOnly
    public ApiResponse<ItemDto.Response> createItem(
            @Valid @RequestBody ItemDto.CreateRequest req,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(itemService.createItem(req, userDetails.getUserId()));
    }

    @PutMapping("/admin/items/{id}")
    @AdminOnly
    public ApiResponse<ItemDto.Response> updateItem(
            @PathVariable Long id,
            @Valid @RequestBody ItemDto.UpdateRequest req,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(itemService.updateItem(id, req, userDetails.getUserId()));
    }

    @DeleteMapping("/admin/items/{id}")
    @AdminOnly
    public ApiResponse<Void> deleteItem(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        itemService.deleteItem(id, userDetails.getUserId());
        return ApiResponse.success(null);
    }

    @GetMapping("/admin/items/rentals")
    @AdminOnly
    public ApiResponse<List<ItemDto.RentalResponse>> getAllRentals(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(itemService.getAllRentals(userDetails.getUserId()));
    }

    @PutMapping("/admin/items/rentals/{rentalId}/approve")
    @AdminOnly
    public ApiResponse<ItemDto.RentalResponse> approveRental(
            @PathVariable Long rentalId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(itemService.approveRental(rentalId, userDetails.getUserId()));
    }

    @PutMapping("/admin/items/rentals/{rentalId}/return")
    @AdminOnly
    public ApiResponse<ItemDto.RentalResponse> returnRental(
            @PathVariable Long rentalId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(itemService.returnRental(rentalId, userDetails.getUserId()));
    }

    @PutMapping("/admin/items/rentals/{rentalId}/reject")
    @AdminOnly
    public ApiResponse<ItemDto.RentalResponse> rejectRental(
            @PathVariable Long rentalId,
            @RequestBody ItemDto.RejectRequest req,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(itemService.rejectRental(rentalId, req.getReason(), userDetails.getUserId()));
    }

    @GetMapping("/items/rentals/{rentalId}/messages")
    public ApiResponse<java.util.List<ItemDto.MessageResponse>> getMessages(
            @PathVariable Long rentalId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(itemService.getMessages(rentalId, userDetails.getUserId()));
    }

    @PostMapping("/items/rentals/{rentalId}/messages")
    public ApiResponse<ItemDto.MessageResponse> sendMessage(
            @PathVariable Long rentalId,
            @Valid @RequestBody ItemDto.MessageRequest req,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(itemService.sendMessage(rentalId, userDetails.getUserId(), req.getContent()));
    }
}
