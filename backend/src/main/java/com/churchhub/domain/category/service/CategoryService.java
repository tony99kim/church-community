package com.churchhub.domain.category.service;

import com.churchhub.domain.category.dto.CategoryDto;
import com.churchhub.domain.category.entity.Category;
import com.churchhub.domain.category.repository.CategoryRepository;
import com.churchhub.exception.BusinessException;
import com.churchhub.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Cacheable("visible-categories")
    public List<CategoryDto.Response> getVisibleCategories() {
        return categoryRepository.findAllByVisibleTrueOrderBySortOrderAsc()
                .stream().map(CategoryDto.Response::from).toList();
    }

    @Cacheable("all-categories")
    public List<CategoryDto.Response> getAllCategories() {
        return categoryRepository.findAll()
                .stream().map(CategoryDto.Response::from).toList();
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(cacheNames = "visible-categories", allEntries = true),
        @CacheEvict(cacheNames = "all-categories", allEntries = true)
    })
    public CategoryDto.Response createCategory(CategoryDto.CreateRequest request) {
        Category category = Category.builder()
                .name(request.getName())
                .description(request.getDescription())
                .type(request.getType())
                .sortOrder(request.getSortOrder())
                .build();
        return CategoryDto.Response.from(categoryRepository.save(category));
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(cacheNames = "visible-categories", allEntries = true),
        @CacheEvict(cacheNames = "all-categories", allEntries = true)
    })
    public CategoryDto.Response updateCategory(Long id, CategoryDto.UpdateRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND));
        category.update(request.getName(), request.getDescription(), request.getType(), request.isVisible(), request.getSortOrder());
        return CategoryDto.Response.from(category);
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(cacheNames = "visible-categories", allEntries = true),
        @CacheEvict(cacheNames = "all-categories", allEntries = true)
    })
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND));
        categoryRepository.delete(category);
    }
}
