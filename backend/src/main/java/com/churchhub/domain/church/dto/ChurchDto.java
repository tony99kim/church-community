package com.churchhub.domain.church.dto;

import com.churchhub.domain.church.entity.Church;
import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

public class ChurchDto {

    @Getter
    public static class CreateRequest {
        @NotBlank private String name;
        @NotBlank private String address;
        private String sundayServiceTime;
        private boolean hasYouthGroup;
        private String contactInfo;
        private String introduction;
        private String websiteUrl;
        private String instagramUrl;
    }

    @Getter
    public static class UpdateRequest {
        @NotBlank private String name;
        @NotBlank private String address;
        private String sundayServiceTime;
        private boolean hasYouthGroup;
        private String contactInfo;
        private String introduction;
        private String websiteUrl;
        private String instagramUrl;
        private boolean visible;
    }

    @Getter
    @Builder
    public static class Response {
        private Long id;
        private String name;
        private String address;
        private String sundayServiceTime;
        private boolean hasYouthGroup;
        private String contactInfo;
        private String introduction;
        private String websiteUrl;
        private String instagramUrl;
        private boolean visible;
        private LocalDateTime createdAt;

        public static Response from(Church church) {
            return Response.builder()
                    .id(church.getId())
                    .name(church.getName())
                    .address(church.getAddress())
                    .sundayServiceTime(church.getSundayServiceTime())
                    .hasYouthGroup(church.isHasYouthGroup())
                    .contactInfo(church.getContactInfo())
                    .introduction(church.getIntroduction())
                    .websiteUrl(church.getWebsiteUrl())
                    .instagramUrl(church.getInstagramUrl())
                    .visible(church.isVisible())
                    .createdAt(church.getCreatedAt())
                    .build();
        }
    }
}
