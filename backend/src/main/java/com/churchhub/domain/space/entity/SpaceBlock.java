package com.churchhub.domain.space.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "space_blocks")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class SpaceBlock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "space_id", nullable = false)
    private Space space;

    @Column(nullable = false, length = 100)
    private String reason;

    @Column(nullable = false)
    private boolean recurring;

    // 반복 차단: 1=월 ~ 7=일 (ISO DayOfWeek)
    private Integer dayOfWeek;

    // 일회성 차단 날짜
    private LocalDate blockDate;

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public SpaceBlock(Space space, String reason, boolean recurring,
                      Integer dayOfWeek, LocalDate blockDate,
                      LocalTime startTime, LocalTime endTime) {
        this.space = space;
        this.reason = reason;
        this.recurring = recurring;
        this.dayOfWeek = dayOfWeek;
        this.blockDate = blockDate;
        this.startTime = startTime;
        this.endTime = endTime;
    }
}
