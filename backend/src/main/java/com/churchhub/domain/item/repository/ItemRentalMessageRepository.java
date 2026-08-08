package com.churchhub.domain.item.repository;

import com.churchhub.domain.item.entity.ItemRentalMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ItemRentalMessageRepository extends JpaRepository<ItemRentalMessage, Long> {
    List<ItemRentalMessage> findAllByRentalIdOrderByCreatedAtAsc(Long rentalId);
}
