package com.churchhub.domain.item.repository;

import com.churchhub.domain.item.entity.Item;
import com.churchhub.domain.item.entity.ItemCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ItemRepository extends JpaRepository<Item, Long> {
    List<Item> findAllByOrderByCategoryAscNameAsc();
    List<Item> findAllByCategoryOrderByNameAsc(ItemCategory category);
    List<Item> findAllByOrderByCreatedAtDesc();
}
