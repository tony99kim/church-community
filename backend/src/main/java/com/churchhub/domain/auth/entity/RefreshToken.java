package com.churchhub.domain.auth.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "refresh_tokens", indexes = @Index(columnList = "userId"))
@Getter
@NoArgsConstructor
public class RefreshToken {

    @Id
    private String token;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    public RefreshToken(String token, Long userId, long ttlSeconds) {
        this.token = token;
        this.userId = userId;
        this.expiresAt = LocalDateTime.now().plusSeconds(ttlSeconds);
    }

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }
}
