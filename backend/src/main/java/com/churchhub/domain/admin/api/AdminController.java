package com.churchhub.domain.admin.api;

import com.churchhub.common.response.ApiResponse;
import com.churchhub.domain.admin.dto.AdminDto;
import com.churchhub.domain.admin.service.AdminService;
import com.churchhub.domain.category.dto.CategoryDto;
import com.churchhub.domain.category.service.CategoryService;
import com.churchhub.domain.user.dto.UserDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "관리자", description = "관리자 전용 API")
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final CategoryService categoryService;

    @Operation(summary = "대시보드 통계")
    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<AdminDto.DashboardResponse>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getDashboard()));
    }

    @Operation(summary = "회원 목록 조회")
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Page<UserDto.Response>>> getUsers(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getUsers(pageable)));
    }

    @Operation(summary = "회원 상태 변경 (정지/활성)")
    @PutMapping("/users/{userId}/status")
    public ResponseEntity<ApiResponse<UserDto.Response>> updateUserStatus(
            @PathVariable Long userId,
            @RequestBody AdminDto.UpdateUserStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.success(adminService.updateUserStatus(userId, request)));
    }

    @Operation(summary = "회원 권한 변경")
    @PutMapping("/users/{userId}/role")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<UserDto.Response>> updateUserRole(
            @PathVariable Long userId,
            @RequestBody AdminDto.UpdateUserRoleRequest request) {
        return ResponseEntity.ok(ApiResponse.success(adminService.updateUserRole(userId, request)));
    }

    @Operation(summary = "게시글 상태 변경")
    @PutMapping("/posts/{postId}/status")
    public ResponseEntity<ApiResponse<Void>> updatePostStatus(
            @PathVariable Long postId,
            @RequestBody AdminDto.UpdatePostStatusRequest request) {
        adminService.updatePostStatus(postId, request.getStatus());
        return ResponseEntity.ok(ApiResponse.success("게시글 상태가 변경되었습니다.", null));
    }

    @Operation(summary = "카테고리 생성")
    @PostMapping("/categories")
    public ResponseEntity<ApiResponse<CategoryDto.Response>> createCategory(
            @Valid @RequestBody CategoryDto.CreateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(categoryService.createCategory(request)));
    }

    @Operation(summary = "카테고리 수정")
    @PutMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<CategoryDto.Response>> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryDto.UpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(categoryService.updateCategory(id, request)));
    }

    @Operation(summary = "카테고리 삭제")
    @DeleteMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success("카테고리가 삭제되었습니다.", null));
    }

    @Operation(summary = "전체 카테고리 목록 (비공개 포함)")
    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<CategoryDto.Response>>> getAllCategories() {
        return ResponseEntity.ok(ApiResponse.success(categoryService.getAllCategories()));
    }
}
