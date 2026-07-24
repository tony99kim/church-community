package com.churchhub.domain.space.entity;

import com.churchhub.domain.church.entity.Church;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "spaces")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Space {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "church_id")
    private Church church;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 200)
    private String description;

    @Column(length = 200)
    private String usageTypes;

    private Integer capacity;

    private boolean available = true;

    @Column(nullable = false)
    private LocalTime openTime = LocalTime.of(9, 0);

    @Column(nullable = false)
    private LocalTime closeTime = LocalTime.of(21, 0);

    @Column(nullable = false)
    private int slotMinutes = 60;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Builder
    public Space(Church church, String name, String description, String usageTypes,
                 Integer capacity, LocalTime openTime, LocalTime closeTime, int slotMinutes) {
        this.church = church;
        this.name = name;
        this.description = description;
        this.usageTypes = usageTypes;
        this.capacity = capacity;
        if (openTime != null) this.openTime = openTime;
        if (closeTime != null) this.closeTime = closeTime;
        if (slotMinutes > 0) this.slotMinutes = slotMinutes;
    }

    public void update(String name, String description, String usageTypes, Integer capacity,
                       boolean available, LocalTime openTime, LocalTime closeTime, int slotMinutes) {
        this.name = name;
        this.description = description;
        this.usageTypes = usageTypes;
        this.capacity = capacity;
        this.available = available;
        if (openTime != null) this.openTime = openTime;
        if (closeTime != null) this.closeTime = closeTime;
        if (slotMinutes > 0) this.slotMinutes = slotMinutes;
    }

    public void updateChurch(Church church) {
        this.church = church;
    }
}
