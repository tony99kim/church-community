package com.churchhub.domain.event.repository;

import com.churchhub.domain.event.entity.EventParticipant;
import com.churchhub.domain.event.entity.EventParticipantStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EventParticipantRepository extends JpaRepository<EventParticipant, Long> {
    boolean existsByEventIdAndUserIdAndStatus(Long eventId, Long userId, EventParticipantStatus status);
    Optional<EventParticipant> findByEventIdAndUserIdAndStatus(Long eventId, Long userId, EventParticipantStatus status);
    Optional<EventParticipant> findByEventIdAndUserId(Long eventId, Long userId);

    @Query("SELECT ep FROM EventParticipant ep JOIN FETCH ep.user JOIN FETCH ep.event WHERE ep.status = 'REGISTERED' ORDER BY ep.createdAt DESC")
    List<EventParticipant> findAllRegistered();

    @Query("SELECT ep FROM EventParticipant ep JOIN FETCH ep.user JOIN FETCH ep.event WHERE ep.event.id = :eventId AND ep.status = 'REGISTERED' ORDER BY ep.createdAt DESC")
    List<EventParticipant> findRegisteredByEventId(@Param("eventId") Long eventId);
}
