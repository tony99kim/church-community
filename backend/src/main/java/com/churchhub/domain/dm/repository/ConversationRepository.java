package com.churchhub.domain.dm.repository;

import com.churchhub.domain.dm.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    List<Conversation> findByUserIdOrderByLastMessageAtDesc(Long userId);
    List<Conversation> findByPastorIdOrderByLastMessageAtDesc(Long pastorId);
    Optional<Conversation> findByUserIdAndPastorIdAndFaithQuestionIsNull(Long userId, Long pastorId);
}
