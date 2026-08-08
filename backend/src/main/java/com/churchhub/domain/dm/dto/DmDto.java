package com.churchhub.domain.dm.dto;

import com.churchhub.domain.dm.entity.Conversation;
import com.churchhub.domain.dm.entity.ConversationMessage;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

public class DmDto {

    @Getter
    public static class StartRequest {
        @NotNull private Long pastorId;
        private Long faithQuestionId;
        @NotBlank private String initialMessage;
    }

    @Getter
    public static class SendRequest {
        @NotBlank private String content;
    }

    @Getter
    @Builder
    public static class ConversationResponse {
        private Long id;
        private Long userId;
        private String userNickname;
        private Long pastorId;
        private String pastorNickname;
        private Long faithQuestionId;
        private String lastMessagePreview;
        private LocalDateTime lastMessageAt;
        private long unreadCount;
        private LocalDateTime createdAt;

        public static ConversationResponse from(Conversation c, String preview, long unread) {
            return ConversationResponse.builder()
                    .id(c.getId())
                    .userId(c.getUser().getId())
                    .userNickname(c.getUser().getNickname())
                    .pastorId(c.getPastor().getId())
                    .pastorNickname(c.getPastor().getNickname())
                    .faithQuestionId(c.getFaithQuestion() != null ? c.getFaithQuestion().getId() : null)
                    .lastMessagePreview(preview)
                    .lastMessageAt(c.getLastMessageAt())
                    .unreadCount(unread)
                    .createdAt(c.getCreatedAt())
                    .build();
        }
    }

    @Getter
    @Builder
    public static class MessageResponse {
        private Long id;
        private Long senderId;
        private String senderNickname;
        private String content;
        private boolean read;
        private LocalDateTime createdAt;

        public static MessageResponse from(ConversationMessage m) {
            return MessageResponse.builder()
                    .id(m.getId())
                    .senderId(m.getSender().getId())
                    .senderNickname(m.getSender().getNickname())
                    .content(m.getContent())
                    .read(m.isRead())
                    .createdAt(m.getCreatedAt())
                    .build();
        }
    }

    @Getter
    @Builder
    public static class UnreadCountResponse {
        private long count;
    }
}
