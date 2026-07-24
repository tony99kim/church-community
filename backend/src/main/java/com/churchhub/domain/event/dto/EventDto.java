package com.churchhub.domain.event.dto;

import com.churchhub.domain.event.entity.Event;
import com.churchhub.domain.event.entity.EventCategory;
import com.churchhub.domain.event.entity.EventStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

public class EventDto {

    @Getter
    public static class CreateRequest {
        @NotBlank private String title;
        @NotBlank private String description;
        @NotBlank private String location;
        @NotNull  private LocalDateTime startDate;
        @NotNull  private LocalDateTime endDate;
        private Integer maxParticipants;
        private String thumbnailUrl;
        private EventCategory category;
        private Long churchId;
    }

    @Getter
    public static class UpdateRequest {
        @NotBlank private String title;
        @NotBlank private String description;
        @NotBlank private String location;
        @NotNull  private LocalDateTime startDate;
        @NotNull  private LocalDateTime endDate;
        private Integer maxParticipants;
        private String thumbnailUrl;
        private EventStatus status;
        private EventCategory category;
        private Long churchId;
    }

    @Getter
    @Builder
    public static class Response {
        private Long id;
        private String title;
        private String description;
        private String location;
        private LocalDateTime startDate;
        private LocalDateTime endDate;
        private Integer maxParticipants;
        private int currentParticipants;
        private String thumbnailUrl;
        private EventCategory category;
        private EventStatus status;
        private String authorNickname;
        private Long churchId;
        private String churchName;
        private boolean joined;
        private LocalDateTime createdAt;

        public static Response from(Event event, boolean joined) {
            return Response.builder()
                    .id(event.getId())
                    .title(event.getTitle())
                    .description(event.getDescription())
                    .location(event.getLocation())
                    .startDate(event.getStartDate())
                    .endDate(event.getEndDate())
                    .maxParticipants(event.getMaxParticipants())
                    .currentParticipants(event.getCurrentParticipants())
                    .thumbnailUrl(event.getThumbnailUrl())
                    .category(event.getCategory())
                    .status(event.getStatus())
                    .authorNickname(event.getAuthor().getNickname())
                    .churchId(event.getChurch() != null ? event.getChurch().getId() : null)
                    .churchName(event.getChurch() != null ? event.getChurch().getName() : null)
                    .joined(joined)
                    .createdAt(event.getCreatedAt())
                    .build();
        }
    }
}
