package com.churchhub.domain.church.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "churches")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Church {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 200)
    private String address;

    @Column(length = 200)
    private String sundayServiceTime;

    private boolean hasYouthGroup = false;

    @Column(length = 100)
    private String contactInfo;

    @Column(length = 200)
    private String introduction;

    @Column(length = 200)
    private String websiteUrl;

    @Column(length = 200)
    private String instagramUrl;

    private boolean visible = true;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Builder
    public Church(String name, String address, String sundayServiceTime,
                  boolean hasYouthGroup, String contactInfo, String introduction,
                  String websiteUrl, String instagramUrl) {
        this.name = name;
        this.address = address;
        this.sundayServiceTime = sundayServiceTime;
        this.hasYouthGroup = hasYouthGroup;
        this.contactInfo = contactInfo;
        this.introduction = introduction;
        this.websiteUrl = websiteUrl;
        this.instagramUrl = instagramUrl;
    }

    public void update(String name, String address, String sundayServiceTime,
                       boolean hasYouthGroup, String contactInfo, String introduction,
                       String websiteUrl, String instagramUrl, boolean visible) {
        this.name = name;
        this.address = address;
        this.sundayServiceTime = sundayServiceTime;
        this.hasYouthGroup = hasYouthGroup;
        this.contactInfo = contactInfo;
        this.introduction = introduction;
        this.websiteUrl = websiteUrl;
        this.instagramUrl = instagramUrl;
        this.visible = visible;
    }
}
