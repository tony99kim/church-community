package com.churchhub.domain.notification.dto;

import com.churchhub.domain.notification.entity.Notification;
import com.churchhub.domain.notification.entity.NotificationType;
import com.churchhub.domain.notification.entity.RelatedType;
import lombok.Getter;

import java.time.LocalDateTime;

public class NotificationDto {

    @Getter
    public static class Response {
        private final Long id;
        private final NotificationType type;
        private final String content;
        private final String senderNickname;
        private final Long relatedId;
        private final RelatedType relatedType;
        private final boolean isRead;
        private final LocalDateTime createdAt;

        private Response(Notification n) {
            this.id = n.getId();
            this.type = n.getType();
            this.content = n.getContent();
            this.senderNickname = n.getSender() != null ? n.getSender().getNickname() : null;
            this.relatedId = n.getRelatedId();
            this.relatedType = n.getRelatedType();
            this.isRead = n.isRead();
            this.createdAt = n.getCreatedAt();
        }

        public static Response from(Notification n) {
            return new Response(n);
        }
    }
}
