package com.churchhub.domain.faith.entity;

import com.churchhub.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "faith_questions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class FaithQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User author;

    private boolean anonymous = false;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    private boolean publicVisible = true;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public FaithQuestion(User author, String content, boolean anonymous, boolean publicVisible) {
        this.author = author;
        this.content = content;
        this.anonymous = anonymous;
        this.publicVisible = publicVisible;
    }
}
