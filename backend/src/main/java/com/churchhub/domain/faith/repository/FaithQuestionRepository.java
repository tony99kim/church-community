package com.churchhub.domain.faith.repository;

import com.churchhub.domain.faith.entity.FaithQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FaithQuestionRepository extends JpaRepository<FaithQuestion, Long> {
    List<FaithQuestion> findAllByPublicVisibleTrueOrderByCreatedAtDesc();
}
