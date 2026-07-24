package com.churchhub.domain.space.repository;

import com.churchhub.domain.space.entity.Space;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SpaceRepository extends JpaRepository<Space, Long> {
    List<Space> findAllByOrderByCreatedAtDesc();

    @Query("SELECT s FROM Space s LEFT JOIN FETCH s.church ORDER BY s.createdAt DESC")
    List<Space> findAllWithChurchOrderByCreatedAtDesc();

    @Query("SELECT s FROM Space s LEFT JOIN FETCH s.church WHERE s.church.id = :churchId ORDER BY s.createdAt DESC")
    List<Space> findByChurchIdWithChurchOrderByCreatedAtDesc(@Param("churchId") Long churchId);
}
