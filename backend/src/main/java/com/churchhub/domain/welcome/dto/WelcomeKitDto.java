package com.churchhub.domain.welcome.dto;

import com.churchhub.domain.welcome.entity.WelcomeKit;
import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

public class WelcomeKitDto {

    @Getter
    public static class Request {
        @NotBlank private String name;
        @NotBlank private String phone;
        private String address;
        private String message;
    }

    @Getter
    @Builder
    public static class Response {
        private Long id;
        private String name;
        private String phone;
        private String address;
        private String message;
        private boolean processed;
        private LocalDateTime createdAt;

        public static Response from(WelcomeKit w) {
            return Response.builder()
                    .id(w.getId()).name(w.getName()).phone(w.getPhone())
                    .address(w.getAddress()).message(w.getMessage())
                    .processed(w.isProcessed()).createdAt(w.getCreatedAt()).build();
        }
    }
}
