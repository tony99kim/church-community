package com.churchhub.domain.space.dto;

import com.churchhub.domain.space.entity.RentalStatus;
import com.churchhub.domain.space.entity.Space;
import com.churchhub.domain.space.entity.SpaceRental;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

public class SpaceDto {

    @Getter
    public static class CreateRequest {
        @NotNull private Long churchId;
        @NotBlank private String name;
        private String description;
        private String usageTypes;
        private Integer capacity;
    }

    @Getter
    public static class RentalRequest {
        @NotNull private LocalDateTime startDateTime;
        @NotNull private LocalDateTime endDateTime;
        private Integer headcount;
        @NotBlank private String purpose;
        @NotBlank private String contactPhone;
    }

    @Getter
    public static class RejectRequest {
        private String reason;
    }

    @Getter
    @Builder
    public static class Response {
        private Long id;
        private String churchName;
        private String name;
        private String description;
        private String usageTypes;
        private Integer capacity;
        private boolean available;

        public static Response from(Space s) {
            return Response.builder()
                    .id(s.getId())
                    .churchName(s.getChurch() != null ? s.getChurch().getName() : null)
                    .name(s.getName())
                    .description(s.getDescription())
                    .usageTypes(s.getUsageTypes())
                    .capacity(s.getCapacity())
                    .available(s.isAvailable())
                    .build();
        }
    }

    @Getter
    @Builder
    public static class RentalResponse {
        private Long id;
        private Long spaceId;
        private String spaceName;
        private String applicantNickname;
        private LocalDateTime startDateTime;
        private LocalDateTime endDateTime;
        private Integer headcount;
        private String purpose;
        private String contactPhone;
        private RentalStatus status;
        private String rejectReason;
        private LocalDateTime createdAt;

        public static RentalResponse from(SpaceRental r) {
            return RentalResponse.builder()
                    .id(r.getId())
                    .spaceId(r.getSpace().getId())
                    .spaceName(r.getSpace().getName())
                    .applicantNickname(r.getApplicant().getNickname())
                    .startDateTime(r.getStartDateTime())
                    .endDateTime(r.getEndDateTime())
                    .headcount(r.getHeadcount())
                    .purpose(r.getPurpose())
                    .contactPhone(r.getContactPhone())
                    .status(r.getStatus())
                    .rejectReason(r.getRejectReason())
                    .createdAt(r.getCreatedAt())
                    .build();
        }
    }
}
