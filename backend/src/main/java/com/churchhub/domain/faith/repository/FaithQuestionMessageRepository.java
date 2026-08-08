package com.churchhub.domain.faith.repository;

import com.churchhub.domain.faith.entity.FaithQuestionMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FaithQuestionMessageRepository extends JpaRepository<FaithQuestionMessage, Long> {
    List<FaithQuestionMessage> findAllByQuestionIdOrderByCreatedAtAsc(Long questionId);
}
