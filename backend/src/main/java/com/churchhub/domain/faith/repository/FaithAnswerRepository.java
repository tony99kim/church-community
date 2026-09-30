package com.churchhub.domain.faith.repository;

import com.churchhub.domain.faith.entity.FaithAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FaithAnswerRepository extends JpaRepository<FaithAnswer, Long> {
    @Query("SELECT fa FROM FaithAnswer fa WHERE fa.question.id IN :questionIds ORDER BY fa.question.id ASC, fa.createdAt ASC")
    List<FaithAnswer> findAllByQuestionIds(@Param("questionIds") List<Long> questionIds);
}
