package com.churchhub.domain.space.entity;

import com.churchhub.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "space_rentals")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class SpaceRental {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "space_id", nullable = false)
    private Space space;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User applicant;

    @Column(nullable = false)
    private LocalDateTime startDateTime;

    @Column(nullable = false)
    private LocalDateTime endDateTime;

    private Integer headcount;

    @Column(length = 300)
    private String purpose;

    @Column(length = 100)
    private String contactPhone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RentalStatus status = RentalStatus.PENDING;

    @Column(length = 300)
    private String rejectReason;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public SpaceRental(Space space, User applicant, LocalDateTime startDateTime,
                       LocalDateTime endDateTime, Integer headcount, String purpose, String contactPhone) {
        this.space = space;
        this.applicant = applicant;
        this.startDateTime = startDateTime;
        this.endDateTime = endDateTime;
        this.headcount = headcount;
        this.purpose = purpose;
        this.contactPhone = contactPhone;
    }

    public void approve() { this.status = RentalStatus.APPROVED; }
    public void reject(String reason) {
        this.status = RentalStatus.REJECTED;
        this.rejectReason = reason;
    }
}
