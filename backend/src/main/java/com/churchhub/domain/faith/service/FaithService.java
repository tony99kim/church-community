package com.churchhub.domain.faith.service;

import com.churchhub.domain.faith.dto.FaithDto;
import com.churchhub.domain.faith.entity.FaithAnswer;
import com.churchhub.domain.faith.entity.FaithQuestion;
import com.churchhub.domain.faith.entity.FaithQuestionMessage;
import com.churchhub.domain.faith.entity.PrayerRequest;
import com.churchhub.domain.faith.repository.FaithAnswerRepository;
import com.churchhub.domain.faith.repository.FaithQuestionMessageRepository;
import com.churchhub.domain.faith.repository.FaithQuestionRepository;
import com.churchhub.domain.faith.repository.PrayerRequestRepository;
import com.churchhub.domain.user.entity.User;
import com.churchhub.domain.user.entity.UserRole;
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
    private final FaithQuestionMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final PrayerRequestRepository prayerRequestRepository;

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

    public List<FaithDto.PrayerResponse> getPublicPrayers() {
        return prayerRequestRepository.findAllByPublicVisibleTrueOrderByCreatedAtDesc()
                .stream().map(FaithDto.PrayerResponse::from).toList();
    }

    public List<FaithDto.QuestionResponse> getAllQuestionsForAdmin() {
        return questionRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(q -> FaithDto.QuestionResponse.from(q,
                        answerRepository.findAllByQuestionIdOrderByCreatedAtAsc(q.getId())))
                .toList();
    }

    public List<FaithDto.PrayerResponse> getAllPrayersForAdmin() {
        return prayerRequestRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(FaithDto.PrayerResponse::from).toList();
    }

    public List<FaithDto.QuestionResponse> getMyQuestions(Long userId) {
        return questionRepository.findAllByAuthorIdOrderByCreatedAtDesc(userId)
                .stream().map(q -> FaithDto.QuestionResponse.from(q,
                        answerRepository.findAllByQuestionIdOrderByCreatedAtAsc(q.getId())))
                .toList();
    }

    public List<FaithDto.PrayerResponse> getMyPrayers(Long userId) {
        return prayerRequestRepository.findAllByAuthorIdOrderByCreatedAtDesc(userId)
                .stream().map(FaithDto.PrayerResponse::from).toList();
    }

    @Transactional
    public FaithDto.PrayerResponse createPrayer(Long userId, FaithDto.PrayerRequestForm req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        PrayerRequest prayer = PrayerRequest.builder()
                .author(user).content(req.getContent()).publicVisible(req.isPublicVisible()).build();
        return FaithDto.PrayerResponse.from(prayerRequestRepository.save(prayer));
    }

    @Transactional
    public FaithDto.PrayerResponse pray(Long prayerId) {
        PrayerRequest prayer = prayerRequestRepository.findById(prayerId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
        prayer.pray();
        return FaithDto.PrayerResponse.from(prayer);
    }

    public List<FaithDto.MessageResponse> getQuestionMessages(Long questionId, Long callerId) {
        FaithQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
        User caller = userRepository.findById(callerId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        boolean isAdmin = caller.getRole() == UserRole.SUPER_ADMIN
                || caller.getRole() == UserRole.PASTOR;
        if (!isAdmin && !question.getAuthor().getId().equals(callerId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        return messageRepository.findAllByQuestionIdOrderByCreatedAtAsc(questionId)
                .stream().map(FaithDto.MessageResponse::from).toList();
    }

    @Transactional
    public FaithDto.MessageResponse sendQuestionMessage(Long questionId, Long callerId, String content) {
        FaithQuestion question = questionRepository.findById(questionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
        User caller = userRepository.findById(callerId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        boolean isAdmin = caller.getRole() == UserRole.SUPER_ADMIN
                || caller.getRole() == UserRole.PASTOR;
        if (!isAdmin && !question.getAuthor().getId().equals(callerId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        String role = isAdmin ? "PASTOR" : "USER";
        FaithQuestionMessage msg = FaithQuestionMessage.builder()
                .question(question).sender(caller).senderRole(role).content(content).build();
        return FaithDto.MessageResponse.from(messageRepository.save(msg));
    }

    @Transactional
    public FaithDto.PrayerResponse toggleAdminPrayed(Long prayerId) {
        PrayerRequest prayer = prayerRequestRepository.findById(prayerId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
        prayer.toggleAdminPrayed();
        return FaithDto.PrayerResponse.from(prayer);
    }
}
