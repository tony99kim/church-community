package com.churchhub.domain.comment.service;

import com.churchhub.domain.board.entity.Post;
import com.churchhub.domain.board.repository.PostRepository;
import com.churchhub.domain.comment.dto.CommentDto;
import com.churchhub.domain.comment.entity.Comment;
import com.churchhub.domain.comment.entity.CommentStatus;
import com.churchhub.domain.comment.repository.CommentRepository;
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
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public List<CommentDto.Response> getComments(Long postId) {
        List<Comment> topLevel = commentRepository.findTopLevelCommentsByPostId(postId);
        return topLevel.stream().map(c -> {
            List<CommentDto.Response> replies = commentRepository
                    .findRepliesByParentId(c.getId(), CommentStatus.ACTIVE)
                    .stream()
                    .map(r -> CommentDto.Response.from(r, List.of()))
                    .toList();
            return CommentDto.Response.from(c, replies);
        }).toList();
    }

    @Transactional
    public CommentDto.Response createComment(Long postId, CommentDto.CreateRequest request, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        Comment parent = null;
        if (request.getParentId() != null) {
            parent = commentRepository.findById(request.getParentId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.COMMENT_NOT_FOUND));
        }

        Comment comment = Comment.builder()
                .post(post)
                .author(user)
                .parent(parent)
                .content(request.getContent())
                .build();

        post.incrementCommentCount();
        return CommentDto.Response.from(commentRepository.save(comment), List.of());
    }

    @Transactional
    public CommentDto.Response updateComment(Long commentId, CommentDto.UpdateRequest request, Long userId) {
        Comment comment = getActiveComment(commentId);
        if (!comment.isAuthor(userId)) {
            throw new BusinessException(ErrorCode.COMMENT_ACCESS_DENIED);
        }
        comment.update(request.getContent());
        return CommentDto.Response.from(comment, List.of());
    }

    @Transactional
    public void deleteComment(Long commentId, Long userId, boolean isAdmin) {
        Comment comment = getActiveComment(commentId);
        if (!isAdmin && !comment.isAuthor(userId)) {
            throw new BusinessException(ErrorCode.COMMENT_ACCESS_DENIED);
        }
        comment.getPost().decrementCommentCount();
        comment.delete();
    }

    private Comment getActiveComment(Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COMMENT_NOT_FOUND));
        if (!comment.isActive()) {
            throw new BusinessException(ErrorCode.COMMENT_NOT_FOUND);
        }
        return comment;
    }
}
