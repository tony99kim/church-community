package com.churchhub.domain.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, unique = true, length = 20)
    private String nickname;

    @Column(length = 30)
    private String name;

    @Column(length = 20)
    private String phone;

    private String profileImageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role = UserRole.USER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status = UserStatus.ACTIVE;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Builder
    public User(String email, String password, String nickname, String name, String phone) {
        this.email = email;
        this.password = password;
        this.nickname = nickname;
        this.name = name != null ? name : nickname;
        this.phone = phone;
    }

    public void updateProfile(String nickname, String name, String phone, String profileImageUrl) {
        if (nickname != null) this.nickname = nickname;
        if (name != null) this.name = name;
        if (phone != null) this.phone = phone;
        if (profileImageUrl != null) this.profileImageUrl = profileImageUrl;
    }

    public void changePassword(String encodedPassword) {
        this.password = encodedPassword;
    }

    public void changeRole(UserRole role) {
        this.role = role;
    }

    public void changeStatus(UserStatus status) {
        this.status = status;
    }

    public boolean isActive() {
        return this.status == UserStatus.ACTIVE;
    }

    public boolean isAdmin() {
        return this.role == UserRole.CHURCH_MANAGER || this.role == UserRole.SUPER_ADMIN;
    }

    public void anonymize() {
        this.email = "deleted_" + this.id + "@deleted.invalid";
        this.nickname = "탈퇴회원_" + this.id;
        this.name = "탈퇴회원";
        this.phone = null;
        this.profileImageUrl = null;
        this.password = "";
        this.status = UserStatus.DELETED;
    }
}
