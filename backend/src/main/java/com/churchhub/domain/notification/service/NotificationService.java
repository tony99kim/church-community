package com.churchhub.domain.notification.service;

import com.churchhub.domain.notification.dto.NotificationDto;
import com.churchhub.domain.notification.entity.Notification;
import com.churchhub.domain.notification.entity.NotificationType;
import com.churchhub.domain.notification.entity.RelatedType;
import com.churchhub.domain.notification.repository.NotificationRepository;
import com.churchhub.domain.user.entity.User;
import com.churchhub.domain.user.repository.UserRepository;
import com.churchhub.exception.BusinessException;
import com.churchhub.exception.ErrorCode;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public List<NotificationDto.Response> getNotifications(Long userId) {
        return notificationRepository.findAllByReceiverIdOrderByCreatedAtDesc(userId)
                .stream().map(NotificationDto.Response::from).toList();
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByReceiverIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markRead(Long notificationId, Long userId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTIFICATION_NOT_FOUND));
        if (!n.getReceiver().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        n.markRead();
    }

    @Transactional
    public void markAllRead(Long userId) {
        notificationRepository.markAllReadByReceiverId(userId);
    }

    @CircuitBreaker(name = "notification", fallbackMethod = "sendFallback")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void send(Long receiverId, Long senderId, NotificationType type, String content,
                     Long relatedId, RelatedType relatedType) {
        if (receiverId.equals(senderId)) return;
        User receiver = userRepository.getReferenceById(receiverId);
        User sender = senderId != null ? userRepository.getReferenceById(senderId) : null;
        notificationRepository.save(Notification.builder()
                .receiver(receiver)
                .sender(sender)
                .type(type)
                .content(content)
                .relatedId(relatedId)
                .relatedType(relatedType)
                .build());
    }

    private void sendFallback(Long receiverId, Long senderId, NotificationType type, String content,
                              Long relatedId, RelatedType relatedType, Exception e) {
        log.warn("Notification send failed (circuit open), skipping: {}", e.getMessage());
    }
}
