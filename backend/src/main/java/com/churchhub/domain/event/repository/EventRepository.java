package com.churchhub.domain.event.repository;

import com.churchhub.domain.event.entity.Event;
import com.churchhub.domain.event.entity.EventStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventRepository extends JpaRepository<Event, Long> {
    Page<Event> findAllByStatusNot(EventStatus status, Pageable pageable);
    long countByStatus(EventStatus status);
}
