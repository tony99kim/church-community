package com.churchhub.domain.faith.repository;

import org.springframework.data.jpa.repository.Query;
import com.churchhub.domain.faith.entity.FaithQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FaithQuestionRepository extends JpaRepository<FaithQuestion, Long> {
    List<FaithQuestion> findAllByPublicVisibleTrueOrderByCreatedAtDesc();
    List<FaithQuestion> findAllByOrderByCreatedAtDesc();
    List<FaithQuestion> findAllByAuthorIdOrderByCreatedAtDesc(Long authorId);

    @Query("SELECT COUNT(q) FROM FaithQuestion q WHERE NOT EXISTS (SELECT a FROM FaithAnswer a WHERE a.question = q)")
    long countUnanswered();
}
