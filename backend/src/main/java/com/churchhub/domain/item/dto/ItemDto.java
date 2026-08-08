package com.churchhub.domain.item.dto;

import com.churchhub.domain.item.entity.Item;
import com.churchhub.domain.item.entity.ItemCategory;
import com.churchhub.domain.item.entity.ItemRental;
import com.churchhub.domain.item.entity.ItemRentalMessage;
import com.churchhub.domain.space.entity.RentalStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class ItemDto {

    @Getter
    public static class CreateRequest {
        private Long churchId;
        @NotBlank private String name;
        private String description;
        @NotNull private ItemCategory category;
        private int totalQuantity = 1;
    }

    @Getter
    public static class UpdateRequest {
        private Long churchId;
        @NotBlank private String name;
        private String description;
        @NotNull private ItemCategory category;
        private int totalQuantity = 1;
    }

    @Getter
    public static class RentalRequest {
        private int quantity = 1;
        @NotNull private LocalDate startDate;
        @NotNull private LocalDate endDate;
        @NotBlank private String contactPhone;
        private String purpose;
        private boolean termsAgreed;
    }

    @Getter
    public static class RejectRequest {
        private String reason;
    }

    @Getter
    public static class MessageRequest {
        @NotBlank private String content;
    }

    @Getter
    @Builder
    public static class MessageResponse {
        private Long id;
        private String senderNickname;
        private String senderRole;
        private String content;
        private LocalDateTime createdAt;

        public static MessageResponse from(ItemRentalMessage m) {
            return MessageResponse.builder()
                    .id(m.getId())
                    .senderNickname(m.getSender().getNickname())
                    .senderRole(m.getSenderRole())
                    .content(m.getContent())
                    .createdAt(m.getCreatedAt()).build();
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
        private ItemCategory category;
        private int totalQuantity;
        private int availableQuantity;

        public static Response from(Item i) {
            return Response.builder()
                    .id(i.getId())
                    .churchId(i.getChurch() != null ? i.getChurch().getId() : null)
                    .churchName(i.getChurch() != null ? i.getChurch().getName() : null)
                    .name(i.getName())
                    .description(i.getDescription())
                    .category(i.getCategory())
                    .totalQuantity(i.getTotalQuantity())
                    .availableQuantity(i.getAvailableQuantity())
                    .build();
        }
    }

    @Getter
    @Builder
    public static class RentalResponse {
        private Long id;
        private Long itemId;
        private String itemName;
        private ItemCategory itemCategory;
        private String applicantNickname;
        private int quantity;
        private LocalDate startDate;
        private LocalDate endDate;
        private String contactPhone;
        private String purpose;
        private RentalStatus status;
        private String rejectReason;
        private LocalDateTime createdAt;

        public static RentalResponse from(ItemRental r) {
            return RentalResponse.builder()
                    .id(r.getId()).itemId(r.getItem().getId()).itemName(r.getItem().getName())
                    .itemCategory(r.getItem().getCategory())
                    .applicantNickname(r.getApplicant().getNickname())
                    .quantity(r.getQuantity()).startDate(r.getStartDate()).endDate(r.getEndDate())
                    .contactPhone(r.getContactPhone()).purpose(r.getPurpose())
                    .status(r.getStatus()).rejectReason(r.getRejectReason())
                    .createdAt(r.getCreatedAt()).build();
        }
    }
}
