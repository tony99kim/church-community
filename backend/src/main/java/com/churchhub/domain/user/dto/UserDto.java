package com.churchhub.domain.user.dto;

import com.churchhub.domain.user.entity.User;
import com.churchhub.domain.user.entity.UserRole;
import com.churchhub.domain.user.entity.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

public class UserDto {

    @Getter
    public static class UpdateRequest {
        @Size(min = 2, max = 20, message = "닉네임은 2~20자여야 합니다.")
        private String nickname;
        private String phone;
        private String profileImageUrl;
    }

    @Getter
    public static class ChangePasswordRequest {
        @NotBlank(message = "현재 비밀번호를 입력해주세요.")
        private String currentPassword;

        @NotBlank(message = "새 비밀번호를 입력해주세요.")
        @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
            message = "비밀번호는 8자 이상, 대소문자/숫자/특수문자를 포함해야 합니다."
        )
        private String newPassword;
    }

    @Getter
    @Builder
    public static class Response {
        private Long id;
        private String email;
        private String nickname;
        private String phone;
        private String profileImageUrl;
        private UserRole role;
        private UserStatus status;
        private LocalDateTime createdAt;

        public static Response from(User user) {
            return Response.builder()
                    .id(user.getId())
                    .email(user.getEmail())
                    .nickname(user.getNickname())
                    .phone(user.getPhone())
                    .profileImageUrl(user.getProfileImageUrl())
                    .role(user.getRole())
                    .status(user.getStatus())
                    .createdAt(user.getCreatedAt())
                    .build();
        }
    }
}
