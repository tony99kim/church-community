package com.churchhub.domain.category.service;

import com.churchhub.domain.category.dto.CategoryDto;
import com.churchhub.domain.category.entity.Category;
import com.churchhub.domain.category.entity.CategoryType;
import com.churchhub.domain.category.repository.CategoryRepository;
import com.churchhub.exception.BusinessException;
import com.churchhub.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepository;

    // 평탄한 목록 (사이드바, 글쓰기 등 기본 사용)
    public List<CategoryDto.Response> getVisibleCategories() {
        return categoryRepository.findAllByVisibleTrueOrderBySortOrderAsc()
                .stream().map(CategoryDto.Response::from).toList();
    }

    // 트리 구조 (LOCAL 최상위 + 자식 포함)
    public List<CategoryDto.Response> getVisibleCategoryTree() {
        return categoryRepository.findRootVisibleCategories()
                .stream().map(CategoryDto.Response::fromWithChildren).toList();
    }

    // LOCAL 타입 자식 카테고리 (구 단위)
    public List<CategoryDto.Response> getChildCategories(Long parentId) {
        return categoryRepository.findByParentIdAndVisibleTrueOrderBySortOrderAsc(parentId)
                .stream().map(CategoryDto.Response::from).toList();
    }

    public List<CategoryDto.Response> getAllCategories() {
        return categoryRepository.findAll()
                .stream().map(CategoryDto.Response::from).toList();
    }

    @Transactional
    public CategoryDto.Response createCategory(CategoryDto.CreateRequest request) {
        Category parent = null;
        if (request.getParentId() != null) {
            parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND));
        }
        Category category = Category.builder()
                .name(request.getName())
                .description(request.getDescription())
                .type(request.getType())
                .sortOrder(request.getSortOrder())
                .parent(parent)
                .build();
        return CategoryDto.Response.from(categoryRepository.save(category));
    }

    @Transactional
    public CategoryDto.Response updateCategory(Long id, CategoryDto.UpdateRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND));
        category.update(request.getName(), request.getDescription(), request.getType(), request.isVisible(), request.getSortOrder());
        return CategoryDto.Response.from(category);
    }

    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND));
        categoryRepository.delete(category);
    }
}
