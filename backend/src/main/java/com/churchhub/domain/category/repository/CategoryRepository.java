package com.churchhub.domain.category.repository;

import com.churchhub.domain.category.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findAllByVisibleTrueOrderBySortOrderAsc();
}
