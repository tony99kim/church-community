package com.churchhub.domain.welcome.entity;

import com.churchhub.domain.user.entity.User;
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(length = 200)
    private String address;

    @Column(length = 300)
    private String message;

    @Column(length = 500)
    private String adminMessage;

    private boolean processed = false;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public WelcomeKit(User user, String name, String phone, String address, String message) {
        this.user = user;
        this.name = name;
        this.phone = phone;
        this.address = address;
        this.message = message;
    }

    public void markProcessed() { this.processed = true; }
    public void setAdminMessage(String msg) { this.adminMessage = msg; }
}
