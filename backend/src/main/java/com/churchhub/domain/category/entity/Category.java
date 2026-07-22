package com.churchhub.domain.category.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "categories")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String name;

    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CategoryType type;

    private boolean visible = true;

    private int sortOrder = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Category parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL)
    @OrderBy("sortOrder ASC")
    private List<Category> children = new ArrayList<>();

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Builder
    public Category(String name, String description, CategoryType type, int sortOrder, Category parent) {
        this.name = name;
        this.description = description;
        this.type = type;
        this.sortOrder = sortOrder;
        this.visible = true;
        this.parent = parent;
    }

    public void update(String name, String description, CategoryType type, boolean visible, int sortOrder) {
        this.name = name;
        this.description = description;
        this.type = type;
        this.visible = visible;
        this.sortOrder = sortOrder;
    }

    public Long getParentId() {
        return parent != null ? parent.getId() : null;
    }
}
