package com.churchhub.domain.event.service;

import com.churchhub.domain.event.dto.EventDto;
import com.churchhub.domain.event.entity.Event;
import com.churchhub.domain.event.entity.EventParticipant;
import com.churchhub.domain.event.entity.EventParticipantStatus;
import com.churchhub.domain.event.entity.EventStatus;
import com.churchhub.domain.event.repository.EventParticipantRepository;
import com.churchhub.domain.event.repository.EventRepository;
import com.churchhub.domain.user.entity.User;
import com.churchhub.domain.user.repository.UserRepository;
import com.churchhub.exception.BusinessException;
import com.churchhub.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EventService {

    private final EventRepository eventRepository;
    private final EventParticipantRepository participantRepository;
    private final UserRepository userRepository;

    public Page<EventDto.Response> getEvents(Pageable pageable) {
        return eventRepository.findAllByStatusNot(EventStatus.CANCELLED, pageable)
                .map(e -> EventDto.Response.from(e, false));
    }

    public EventDto.Response getEvent(Long eventId, Long userId) {
        Event event = getEventOrThrow(eventId);
        boolean joined = userId != null && participantRepository
                .existsByEventIdAndUserIdAndStatus(eventId, userId, EventParticipantStatus.REGISTERED);
        return EventDto.Response.from(event, joined);
    }

    @Transactional
    public EventDto.Response createEvent(EventDto.CreateRequest request, Long userId) {
        User author = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        Event event = Event.builder()
                .author(author)
                .title(request.getTitle())
                .description(request.getDescription())
                .location(request.getLocation())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .maxParticipants(request.getMaxParticipants())
                .thumbnailUrl(request.getThumbnailUrl())
                .build();
        return EventDto.Response.from(eventRepository.save(event), false);
    }

    @Transactional
    public EventDto.Response updateEvent(Long eventId, EventDto.UpdateRequest request) {
        Event event = getEventOrThrow(eventId);
        event.update(request.getTitle(), request.getDescription(), request.getLocation(),
                request.getStartDate(), request.getEndDate(),
                request.getMaxParticipants(), request.getThumbnailUrl());
        if (request.getStatus() != null) event.changeStatus(request.getStatus());
        return EventDto.Response.from(event, false);
    }

    @Transactional
    public void deleteEvent(Long eventId) {
        getEventOrThrow(eventId).changeStatus(EventStatus.CANCELLED);
    }

    @Transactional
    public void joinEvent(Long eventId, Long userId) {
        Event event = getEventOrThrow(eventId);
        if (event.isFull()) throw new BusinessException(ErrorCode.EVENT_FULL);
        if (participantRepository.existsByEventIdAndUserIdAndStatus(eventId, userId, EventParticipantStatus.REGISTERED)) {
            throw new BusinessException(ErrorCode.EVENT_ALREADY_JOINED);
        }
        User user = userRepository.getReferenceById(userId);
        participantRepository.save(EventParticipant.builder().event(event).user(user).build());
        event.incrementParticipants();
    }

    @Transactional
    public void cancelJoin(Long eventId, Long userId) {
        EventParticipant participant = participantRepository
                .findByEventIdAndUserIdAndStatus(eventId, userId, EventParticipantStatus.REGISTERED)
                .orElseThrow(() -> new BusinessException(ErrorCode.EVENT_NOT_JOINED));
        participant.cancel();
        getEventOrThrow(eventId).decrementParticipants();
    }

    private Event getEventOrThrow(Long eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new BusinessException(ErrorCode.EVENT_NOT_FOUND));
    }
}
