package com.churchhub.domain.space.entity;

import com.churchhub.domain.church.entity.Church;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

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

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Builder
    public Space(Church church, String name, String description, String usageTypes, Integer capacity) {
        this.church = church;
        this.name = name;
        this.description = description;
        this.usageTypes = usageTypes;
        this.capacity = capacity;
    }

    public void update(String name, String description, String usageTypes, Integer capacity, boolean available) {
        this.name = name;
        this.description = description;
        this.usageTypes = usageTypes;
        this.capacity = capacity;
        this.available = available;
    }
}
