package com.churchhub.domain.dm.entity;

import com.churchhub.domain.faith.entity.FaithQuestion;
import com.churchhub.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "conversations")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pastor_id", nullable = false)
    private User pastor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faith_question_id")
    private FaithQuestion faithQuestion;

    private LocalDateTime lastMessageAt;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public Conversation(User user, User pastor, FaithQuestion faithQuestion) {
        this.user = user;
        this.pastor = pastor;
        this.faithQuestion = faithQuestion;
    }

    public void updateLastMessageAt(LocalDateTime time) {
        this.lastMessageAt = time;
    }
}
