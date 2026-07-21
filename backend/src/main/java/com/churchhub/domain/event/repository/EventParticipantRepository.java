package com.churchhub.domain.event.repository;

import com.churchhub.domain.event.entity.EventParticipant;
import com.churchhub.domain.event.entity.EventParticipantStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EventParticipantRepository extends JpaRepository<EventParticipant, Long> {
    boolean existsByEventIdAndUserIdAndStatus(Long eventId, Long userId, EventParticipantStatus status);
    Optional<EventParticipant> findByEventIdAndUserIdAndStatus(Long eventId, Long userId, EventParticipantStatus status);
}
