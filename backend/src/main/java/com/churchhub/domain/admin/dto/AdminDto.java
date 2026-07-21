package com.churchhub.domain.admin.dto;

import com.churchhub.domain.user.entity.UserRole;
import com.churchhub.domain.user.entity.UserStatus;
import lombok.Builder;
import lombok.Getter;

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
    }

    @Getter
    public static class UpdatePostStatusRequest {
        private String status;
    }
}
