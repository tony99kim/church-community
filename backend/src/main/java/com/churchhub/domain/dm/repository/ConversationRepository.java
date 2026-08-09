package com.churchhub.domain.dm.repository;

import com.churchhub.domain.dm.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    List<Conversation> findByUserIdOrderByLastMessageAtDesc(Long userId);
    List<Conversation> findByPastorIdOrderByLastMessageAtDesc(Long pastorId);
    Optional<Conversation> findByUserIdAndPastorIdAndFaithQuestionIsNull(Long userId, Long pastorId);

    @Query("SELECT c FROM Conversation c WHERE (c.user.id = :userId OR c.pastor.id = :userId) ORDER BY CASE WHEN c.lastMessageAt IS NULL THEN 0 ELSE 1 END DESC, c.lastMessageAt DESC")
    List<Conversation> findAllByParticipant(@Param("userId") Long userId);

    @Query("SELECT c FROM Conversation c WHERE ((c.user.id = :a AND c.pastor.id = :b) OR (c.user.id = :b AND c.pastor.id = :a)) AND c.faithQuestion IS NULL")
    Optional<Conversation> findDirectConversation(@Param("a") Long a, @Param("b") Long b);
}
