package com.churchhub.domain.category.repository;

import com.churchhub.domain.category.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findAllByVisibleTrueOrderBySortOrderAsc();

    @Query("SELECT c FROM Category c WHERE c.parent IS NULL AND c.visible = true ORDER BY c.sortOrder ASC")
    List<Category> findRootVisibleCategories();

    @Query("SELECT c FROM Category c WHERE c.parent.id = :parentId AND c.visible = true ORDER BY c.sortOrder ASC")
    List<Category> findVisibleChildrenByParentId(@Param("parentId") Long parentId);
}
