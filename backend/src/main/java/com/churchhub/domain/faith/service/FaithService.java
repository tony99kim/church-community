package com.churchhub.domain.faith.service;

import com.churchhub.domain.faith.dto.FaithDto;
import com.churchhub.domain.faith.entity.FaithAnswer;
import com.churchhub.domain.faith.entity.FaithQuestion;
import com.churchhub.domain.faith.repository.FaithAnswerRepository;
import com.churchhub.domain.faith.repository.FaithQuestionRepository;
import com.churchhub.domain.user.entity.User;
import com.churchhub.domain.user.repository.UserRepository;
import com.churchhub.exception.BusinessException;
import com.churchhub.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FaithService {

    private final FaithQuestionRepository questionRepository;
    private final FaithAnswerRepository answerRepository;
    private final UserRepository userRepository;

    public List<FaithDto.QuestionResponse> getPublicQuestions() {
        return questionRepository.findAllByPublicVisibleTrueOrderByCreatedAtDesc()
                .stream().map(q -> FaithDto.QuestionResponse.from(q,
                        answerRepository.findAllByQuestionIdOrderByCreatedAtAsc(q.getId())))
                .toList();
    }

    @Transactional
    public FaithDto.QuestionResponse createQuestion(Long userId, FaithDto.QuestionRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        FaithQuestion q = FaithQuestion.builder()
                .author(user).content(req.getContent())
                .anonymous(req.isAnonymous()).publicVisible(req.isPublicVisible()).build();
        FaithQuestion saved = questionRepository.save(q);
        return FaithDto.QuestionResponse.from(saved, List.of());
    }

    @Transactional
    public FaithDto.AnswerResponse createAnswer(Long questionId, Long pastorId, FaithDto.AnswerRequest req) {
        FaithQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
        User pastor = userRepository.findById(pastorId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        FaithAnswer answer = FaithAnswer.builder()
                .question(question).pastor(pastor).content(req.getContent()).build();
        return FaithDto.AnswerResponse.from(answerRepository.save(answer));
    }
}
