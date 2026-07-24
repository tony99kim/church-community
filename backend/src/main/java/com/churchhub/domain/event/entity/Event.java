package com.churchhub.domain.event.entity;

import com.churchhub.domain.church.entity.Church;
import com.churchhub.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "events")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User author;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 200)
    private String location;

    @Column(nullable = false)
    private LocalDateTime startDate;

    @Column(nullable = false)
    private LocalDateTime endDate;

    private Integer maxParticipants;

    private int currentParticipants = 0;

    private String thumbnailUrl;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private EventCategory category = EventCategory.CHURCH;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "church_id")
    private Church church;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventStatus status = EventStatus.UPCOMING;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Builder
    public Event(User author, String title, String description, String location,
                 LocalDateTime startDate, LocalDateTime endDate,
                 Integer maxParticipants, String thumbnailUrl, EventCategory category, Church church) {
        this.author = author;
        this.title = title;
        this.description = description;
        this.location = location;
        this.startDate = startDate;
        this.endDate = endDate;
        this.maxParticipants = maxParticipants;
        this.thumbnailUrl = thumbnailUrl;
        this.category = category != null ? category : EventCategory.CHURCH;
        this.church = church;
    }

    public void update(String title, String description, String location,
                       LocalDateTime startDate, LocalDateTime endDate,
                       Integer maxParticipants, String thumbnailUrl, EventCategory category) {
        this.title = title;
        this.description = description;
        this.location = location;
        this.startDate = startDate;
        this.endDate = endDate;
        this.maxParticipants = maxParticipants;
        if (thumbnailUrl != null) this.thumbnailUrl = thumbnailUrl;
        if (category != null) this.category = category;
    }

    public void changeStatus(EventStatus status) { this.status = status; }

    public void incrementParticipants() { this.currentParticipants++; }
    public void decrementParticipants() { if (this.currentParticipants > 0) this.currentParticipants--; }

    public boolean isFull() {
        return maxParticipants != null && currentParticipants >= maxParticipants;
    }
}
