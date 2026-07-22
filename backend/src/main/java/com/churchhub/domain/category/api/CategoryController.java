package com.churchhub.domain.category.api;

import com.churchhub.common.response.ApiResponse;
import com.churchhub.domain.category.dto.CategoryDto;
import com.churchhub.domain.category.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "카테고리", description = "게시판 카테고리 API")
@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @Operation(summary = "카테고리 목록 (평탄)")
    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryDto.Response>>> getCategories() {
        return ResponseEntity.ok(ApiResponse.success(categoryService.getVisibleCategories()));
    }

    @Operation(summary = "카테고리 트리 (최상위 + 자식 포함)")
    @GetMapping("/tree")
    public ResponseEntity<ApiResponse<List<CategoryDto.Response>>> getCategoryTree() {
        return ResponseEntity.ok(ApiResponse.success(categoryService.getVisibleCategoryTree()));
    }

    @Operation(summary = "자식 카테고리 목록 (구 단위)")
    @GetMapping("/{parentId}/children")
    public ResponseEntity<ApiResponse<List<CategoryDto.Response>>> getChildren(@PathVariable Long parentId) {
        return ResponseEntity.ok(ApiResponse.success(categoryService.getChildCategories(parentId)));
    }
}
