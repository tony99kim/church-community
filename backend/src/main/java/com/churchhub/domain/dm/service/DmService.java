package com.churchhub.domain.dm.service;

import com.churchhub.domain.dm.dto.DmDto;
import com.churchhub.domain.dm.entity.Conversation;
import com.churchhub.domain.dm.entity.ConversationMessage;
import com.churchhub.domain.dm.repository.ConversationMessageRepository;
import com.churchhub.domain.dm.repository.ConversationRepository;
import com.churchhub.domain.faith.entity.FaithQuestion;
import com.churchhub.domain.faith.repository.FaithQuestionRepository;
import com.churchhub.domain.user.entity.User;
import com.churchhub.domain.user.repository.UserRepository;
import com.churchhub.exception.BusinessException;
import com.churchhub.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DmService {

    private final ConversationRepository conversationRepository;
    private final ConversationMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final FaithQuestionRepository faithQuestionRepository;

    public List<DmDto.ConversationResponse> listMyConversations(Long callerId) {
        List<Conversation> convs = conversationRepository.findAllByParticipant(callerId);

        return convs.stream().map(c -> {
            List<ConversationMessage> msgs = messageRepository.findAllByConversationIdOrderByCreatedAtAsc(c.getId());
            String preview = msgs.isEmpty() ? "" : msgs.get(msgs.size() - 1).getContent();
            if (preview.length() > 50) preview = preview.substring(0, 50) + "...";
            long unread = messageRepository.countUnreadInConversation(c.getId(), callerId);
            return DmDto.ConversationResponse.from(c, preview, unread);
        }).toList();
    }

    @Transactional
    public DmDto.ConversationResponse startConversation(Long callerId, DmDto.StartRequest req) {
        User caller = getUser(callerId);
        User recipient = userRepository.findById(req.getRecipientId())
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        if (caller.getId().equals(recipient.getId())) throw new BusinessException(ErrorCode.FORBIDDEN);

        Conversation conv;
        if (req.getFaithQuestionId() != null) {
            FaithQuestion question = faithQuestionRepository.findById(req.getFaithQuestionId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
            conv = conversationRepository.save(
                    Conversation.builder().user(caller).pastor(recipient).faithQuestion(question).build());
        } else {
            conv = conversationRepository
                    .findDirectConversation(callerId, req.getRecipientId())
                    .orElseGet(() -> conversationRepository.save(
                            Conversation.builder().user(caller).pastor(recipient).build()));
        }

        String content = req.getInitialMessage();
        messageRepository.save(ConversationMessage.builder()
                .conversation(conv).sender(caller).content(content).build());
        conv.updateLastMessageAt(LocalDateTime.now());

        return DmDto.ConversationResponse.from(conv, content, 0);
    }

    @Transactional
    public List<DmDto.MessageResponse> getMessages(Long convId, Long callerId) {
        Conversation conv = getConversationWithAccess(convId, callerId);
        messageRepository.markAsRead(convId, callerId);
        return messageRepository.findAllByConversationIdOrderByCreatedAtAsc(conv.getId())
                .stream().map(DmDto.MessageResponse::from).toList();
    }

    @Transactional
    public DmDto.MessageResponse sendMessage(Long convId, Long callerId, String content) {
        Conversation conv = getConversationWithAccess(convId, callerId);
        User caller = getUser(callerId);
        ConversationMessage msg = messageRepository.save(
                ConversationMessage.builder().conversation(conv).sender(caller).content(content).build());
        conv.updateLastMessageAt(LocalDateTime.now());
        return DmDto.MessageResponse.from(msg);
    }

    public DmDto.UnreadCountResponse getUnreadCount(Long callerId) {
        return DmDto.UnreadCountResponse.builder()
                .count(messageRepository.countUnreadForCaller(callerId))
                .build();
    }

    private Conversation getConversationWithAccess(Long convId, Long callerId) {
        Conversation conv = conversationRepository.findById(convId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CONVERSATION_NOT_FOUND));
        boolean isParticipant = conv.getUser().getId().equals(callerId)
                || conv.getPastor().getId().equals(callerId);
        if (!isParticipant) throw new BusinessException(ErrorCode.FORBIDDEN);
        return conv;
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }
}
