package com.churchhub.domain.space.dto;

import com.churchhub.domain.space.entity.RentalStatus;
import com.churchhub.domain.space.entity.Space;
import com.churchhub.domain.space.entity.SpaceBlock;
import com.churchhub.domain.space.entity.SpaceRental;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public class SpaceDto {

    @Getter
    public static class CreateRequest {
        private Long churchId;
        @NotBlank private String name;
        private String description;
        private String usageTypes;
        private Integer capacity;
        private LocalTime openTime;
        private LocalTime closeTime;
        @Min(1)
        private int slotMinutes = 60;
        private String imageUrl;
    }

    @Getter
    public static class UpdateRequest {
        private Long churchId;
        @NotBlank private String name;
        private String description;
        private String usageTypes;
        private Integer capacity;
        private boolean available = true;
        private LocalTime openTime;
        private LocalTime closeTime;
        @Min(1)
        private int slotMinutes = 60;
        private String imageUrl;
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
    public static class BlockRequest {
        @NotBlank private String reason;
        private boolean recurring;
        private Integer dayOfWeek;   // recurring=true: 1=월~7=일
        private LocalDate blockDate; // recurring=false
        @NotNull private LocalTime startTime;
        @NotNull private LocalTime endTime;
    }

    @Getter
    @Builder
    public static class BlockResponse {
        private Long id;
        private String reason;
        private boolean recurring;
        private Integer dayOfWeek;
        private LocalDate blockDate;
        private LocalTime startTime;
        private LocalTime endTime;

        public static BlockResponse from(SpaceBlock b) {
            return BlockResponse.builder()
                    .id(b.getId()).reason(b.getReason()).recurring(b.isRecurring())
                    .dayOfWeek(b.getDayOfWeek()).blockDate(b.getBlockDate())
                    .startTime(b.getStartTime()).endTime(b.getEndTime()).build();
        }
    }

    @Getter
    @Builder
    public static class Response {
        private Long id;
        private Long churchId;
        private String churchName;
        private String name;
        private String description;
        private String usageTypes;
        private Integer capacity;
        private boolean available;
        private LocalTime openTime;
        private LocalTime closeTime;
        private int slotMinutes;
        private String imageUrl;

        public static Response from(Space s) {
            return Response.builder()
                    .id(s.getId())
                    .churchId(s.getChurch() != null ? s.getChurch().getId() : null)
                    .churchName(s.getChurch() != null ? s.getChurch().getName() : null)
                    .name(s.getName())
                    .description(s.getDescription())
                    .usageTypes(s.getUsageTypes())
                    .capacity(s.getCapacity())
                    .available(s.isAvailable())
                    .openTime(s.getOpenTime())
                    .closeTime(s.getCloseTime())
                    .slotMinutes(s.getSlotMinutes())
                    .imageUrl(s.getImageUrl())
                    .build();
        }
    }

    @Getter
    @Builder
    public static class SlotResponse {
        private LocalTime startTime;
        private LocalTime endTime;
        private String status; // AVAILABLE, TAKEN, MY_PENDING, MY_APPROVED
        private Long rentalId; // null for AVAILABLE/TAKEN, non-null for MY_PENDING/MY_APPROVED
    }

    @Getter
    public static class RentalMessageRequest {
        private String adminMessage;
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
        private String adminMessage;
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
                    .adminMessage(r.getAdminMessage())
                    .createdAt(r.getCreatedAt())
                    .build();
        }
    }
}
