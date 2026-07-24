package com.churchhub.domain.space.repository;

import com.churchhub.domain.space.entity.SpaceRental;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface SpaceRentalRepository extends JpaRepository<SpaceRental, Long> {
    List<SpaceRental> findAllByOrderByCreatedAtDesc();
    List<SpaceRental> findAllByApplicantIdOrderByCreatedAtDesc(Long userId);
    boolean existsBySpaceId(Long spaceId);
    List<SpaceRental> findBySpace_ChurchIdOrderByCreatedAtDesc(Long churchId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM SpaceRental r WHERE r.space.id = :spaceId " +
           "AND r.status IN (com.churchhub.domain.space.entity.RentalStatus.PENDING, " +
           "com.churchhub.domain.space.entity.RentalStatus.APPROVED) " +
           "AND r.startDateTime < :endTime AND r.endDateTime > :startTime")
    List<SpaceRental> findConflicting(@Param("spaceId") Long spaceId,
                                      @Param("startTime") LocalDateTime startTime,
                                      @Param("endTime") LocalDateTime endTime);

    @Query("SELECT r FROM SpaceRental r WHERE r.space.id = :spaceId " +
           "AND r.status IN (com.churchhub.domain.space.entity.RentalStatus.PENDING, " +
           "com.churchhub.domain.space.entity.RentalStatus.APPROVED) " +
           "AND r.startDateTime < :dayEnd AND r.endDateTime > :dayStart")
    List<SpaceRental> findActiveBySpaceAndDate(@Param("spaceId") Long spaceId,
                                               @Param("dayStart") LocalDateTime dayStart,
                                               @Param("dayEnd") LocalDateTime dayEnd);
}
