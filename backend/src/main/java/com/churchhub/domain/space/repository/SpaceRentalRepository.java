package com.churchhub.domain.space.repository;

import com.churchhub.domain.space.entity.SpaceRental;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SpaceRentalRepository extends JpaRepository<SpaceRental, Long> {
    List<SpaceRental> findAllByOrderByCreatedAtDesc();
    List<SpaceRental> findAllByApplicantIdOrderByCreatedAtDesc(Long userId);
}
