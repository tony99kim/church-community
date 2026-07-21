package com.churchhub.domain.category.api;

import com.churchhub.common.response.ApiResponse;
import com.churchhub.domain.category.dto.CategoryDto;
import com.churchhub.domain.category.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "카테고리", description = "게시판 카테고리 API")
@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @Operation(summary = "카테고리 목록 조회")
    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryDto.Response>>> getCategories() {
        return ResponseEntity.ok(ApiResponse.success(categoryService.getVisibleCategories()));
    }
}
