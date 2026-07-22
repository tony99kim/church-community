package com.churchhub.domain.category.repository;

import com.churchhub.domain.category.entity.Category;
import com.churchhub.domain.category.entity.CategoryType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findAllByVisibleTrueOrderBySortOrderAsc();

    // 최상위 카테고리만 (parent 없음)
    @Query("SELECT c FROM Category c WHERE c.parent IS NULL AND c.visible = true ORDER BY c.sortOrder ASC")
    List<Category> findRootVisibleCategories();

    // LOCAL 타입 최상위 (시도)
    List<Category> findByTypeAndParentIsNullAndVisibleTrueOrderBySortOrderAsc(CategoryType type);

    // 특정 부모의 자식
    List<Category> findByParentIdAndVisibleTrueOrderBySortOrderAsc(Long parentId);
}
