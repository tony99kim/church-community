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
}
