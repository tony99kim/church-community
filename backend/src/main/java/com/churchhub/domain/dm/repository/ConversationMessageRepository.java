package com.churchhub.domain.dm.repository;

import com.churchhub.domain.dm.entity.ConversationMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ConversationMessageRepository extends JpaRepository<ConversationMessage, Long> {

    List<ConversationMessage> findAllByConversationIdOrderByCreatedAtAsc(Long conversationId);

    @Query("SELECT COUNT(m) FROM ConversationMessage m WHERE m.conversation.id = :convId AND m.sender.id != :senderId AND m.read = false")
    long countUnreadInConversation(@Param("convId") Long convId, @Param("senderId") Long senderId);

    @Modifying
    @Query("UPDATE ConversationMessage m SET m.read = true WHERE m.conversation.id = :convId AND m.sender.id != :callerId AND m.read = false")
    void markAsRead(@Param("convId") Long convId, @Param("callerId") Long callerId);

    @Query("SELECT COUNT(m) FROM ConversationMessage m WHERE (m.conversation.user.id = :callerId OR m.conversation.pastor.id = :callerId) AND m.sender.id != :callerId AND m.read = false")
    long countUnreadForCaller(@Param("callerId") Long callerId);
}
