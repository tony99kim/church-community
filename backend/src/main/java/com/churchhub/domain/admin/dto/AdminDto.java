package com.churchhub.domain.admin.dto;

import com.churchhub.domain.event.entity.EventParticipant;
import com.churchhub.domain.user.entity.UserRole;
import com.churchhub.domain.user.entity.UserStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

public class AdminDto {

    @Getter
    @Builder
    public static class DashboardResponse {
        private long totalUsers;
        private long totalPosts;
        private long newUsersToday;
        private long newPostsToday;
    }

    @Getter
    public static class UpdateUserStatusRequest {
        private UserStatus status;
    }

    @Getter
    public static class UpdateUserRoleRequest {
        private UserRole role;
        private Long churchId;
    }

    @Getter
    public static class UpdatePostStatusRequest {
        private String status;
    }

    @Getter
    @Builder
    public static class ParticipantResponse {
        private Long userId;
        private String email;
        private String nickname;
        private String phone;
        private LocalDateTime registeredAt;
        private Long eventId;
        private String eventTitle;

        public static ParticipantResponse from(EventParticipant ep) {
            return ParticipantResponse.builder()
                    .userId(ep.getUser().getId())
                    .email(ep.getUser().getEmail())
                    .nickname(ep.getUser().getNickname())
                    .phone(ep.getUser().getPhone())
                    .registeredAt(ep.getCreatedAt())
                    .eventId(ep.getEvent().getId())
                    .eventTitle(ep.getEvent().getTitle())
                    .build();
        }
    }

    // 관리자 사이드바 배지용 대기 건수. 볼 권한이 없는 항목은 0
    @Getter
    @Builder
    public static class PendingCountsResponse {
        private long spaceRentals;
        private long itemRentals;
        private long welcomeKits;
        private long faithQuestions;
        private long reports;
    }
}
