package com.churchhub.domain.event.repository;

import com.churchhub.domain.event.entity.Event;
import com.churchhub.domain.event.entity.EventCategory;
import com.churchhub.domain.event.entity.EventStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EventRepository extends JpaRepository<Event, Long> {
    Page<Event> findAllByStatusNotIn(java.util.List<EventStatus> statuses, Pageable pageable);
    Page<Event> findAllByCategoryOrderByStartDateDesc(EventCategory category, Pageable pageable);
    java.util.List<Event> findAllByCategoryOrderByStartDateDesc(EventCategory category);
    long countByStatus(EventStatus status);

    @Modifying
    @Query("UPDATE Event e SET e.currentParticipants = e.currentParticipants + 1 WHERE e.id = :eventId")
    void incrementParticipants(@Param("eventId") Long eventId);

    @Modifying
    @Query("UPDATE Event e SET e.currentParticipants = GREATEST(0, e.currentParticipants - 1) WHERE e.id = :eventId")
    void decrementParticipants(@Param("eventId") Long eventId);
}
