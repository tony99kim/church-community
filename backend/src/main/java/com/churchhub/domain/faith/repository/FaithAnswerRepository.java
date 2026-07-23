package com.churchhub.domain.faith.repository;

import com.churchhub.domain.faith.entity.FaithAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FaithAnswerRepository extends JpaRepository<FaithAnswer, Long> {
    List<FaithAnswer> findAllByQuestionIdOrderByCreatedAtAsc(Long questionId);
}
