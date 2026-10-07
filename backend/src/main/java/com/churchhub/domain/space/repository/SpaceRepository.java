package com.churchhub.domain.space.repository;

import com.churchhub.domain.space.entity.Space;
import org.springframework.data.jpa.repository.JpaRepository;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SpaceRepository extends JpaRepository<Space, Long> {
    List<Space> findAllByOrderByCreatedAtDesc();

    // 같은 공간에 대한 동시 예약 신청을 직렬화하기 위한 행 잠금
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Space s WHERE s.id = :id")
    Optional<Space> findByIdForUpdate(@Param("id") Long id);

    @Query("SELECT s FROM Space s LEFT JOIN FETCH s.church ORDER BY s.createdAt DESC")
    List<Space> findAllWithChurchOrderByCreatedAtDesc();

    @Query("SELECT s FROM Space s LEFT JOIN FETCH s.church WHERE s.church.id = :churchId ORDER BY s.createdAt DESC")
    List<Space> findByChurchIdWithChurchOrderByCreatedAtDesc(@Param("churchId") Long churchId);
}
