package com.churchhub.domain.item.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "items")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 300)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ItemCategory category;

    private int totalQuantity = 1;
    private int availableQuantity = 1;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Builder
    public Item(String name, String description, ItemCategory category, int totalQuantity) {
        this.name = name;
        this.description = description;
        this.category = category;
        this.totalQuantity = totalQuantity;
        this.availableQuantity = totalQuantity;
    }

    public void update(String name, String description, ItemCategory category, int totalQuantity) {
        this.name = name;
        this.description = description;
        this.category = category;
        this.totalQuantity = totalQuantity;
    }

    public boolean hasStock(int qty) { return availableQuantity >= qty; }
    public void decreaseStock(int qty) { this.availableQuantity -= qty; }
    public void increaseStock(int qty) { this.availableQuantity += qty; }
}
