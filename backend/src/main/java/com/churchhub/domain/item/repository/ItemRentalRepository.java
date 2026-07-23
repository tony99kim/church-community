package com.churchhub.domain.item.repository;

import com.churchhub.domain.item.entity.ItemRental;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ItemRentalRepository extends JpaRepository<ItemRental, Long> {
    List<ItemRental> findAllByOrderByCreatedAtDesc();
    List<ItemRental> findAllByApplicantIdOrderByCreatedAtDesc(Long userId);
}
