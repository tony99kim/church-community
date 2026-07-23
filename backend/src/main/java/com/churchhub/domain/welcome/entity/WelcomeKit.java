package com.churchhub.domain.welcome.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "welcome_kits")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class WelcomeKit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(length = 200)
    private String address;

    @Column(length = 300)
    private String message;

    private boolean processed = false;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public WelcomeKit(String name, String phone, String address, String message) {
        this.name = name;
        this.phone = phone;
        this.address = address;
        this.message = message;
    }

    public void markProcessed() { this.processed = true; }
}
