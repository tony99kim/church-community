package com.churchhub.domain.space.repository;

import com.churchhub.domain.space.entity.Space;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SpaceRepository extends JpaRepository<Space, Long> {
    List<Space> findAllByOrderByCreatedAtDesc();
}
