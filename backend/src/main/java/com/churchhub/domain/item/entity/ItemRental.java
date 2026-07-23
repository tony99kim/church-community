package com.churchhub.domain.item.entity;

import com.churchhub.domain.space.entity.RentalStatus;
import com.churchhub.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "item_rentals")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class ItemRental {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User applicant;

    private int quantity = 1;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Column(length = 100)
    private String contactPhone;

    @Column(length = 300)
    private String purpose;

    private boolean termsAgreed = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RentalStatus status = RentalStatus.PENDING;

    @Column(length = 300)
    private String rejectReason;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public ItemRental(Item item, User applicant, int quantity, LocalDate startDate,
                      LocalDate endDate, String contactPhone, String purpose, boolean termsAgreed) {
        this.item = item;
        this.applicant = applicant;
        this.quantity = quantity;
        this.startDate = startDate;
        this.endDate = endDate;
        this.contactPhone = contactPhone;
        this.purpose = purpose;
        this.termsAgreed = termsAgreed;
    }

    public void approve() { this.status = RentalStatus.APPROVED; }
    public void reject(String reason) {
        this.status = RentalStatus.REJECTED;
        this.rejectReason = reason;
    }
}
