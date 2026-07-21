package com.churchhub.domain.comment.dto;

import com.churchhub.domain.comment.entity.Comment;
import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

public class CommentDto {

    @Getter
    public static class CreateRequest {
        @NotBlank(message = "내용을 입력해주세요.")
        private String content;
        private Long parentId;
    }

    @Getter
    public static class UpdateRequest {
        @NotBlank(message = "내용을 입력해주세요.")
        private String content;
    }

    @Getter
    @Builder
    public static class Response {
        private Long id;
        private Long authorId;
        private String authorNickname;
        private String authorProfileImage;
        private String content;
        private boolean deleted;
        private int likeCount;
        private Long parentId;
        private List<Response> replies;
        private LocalDateTime createdAt;

        public static Response from(Comment comment, List<Response> replies) {
            boolean deleted = !comment.isActive();
            return Response.builder()
                    .id(comment.getId())
                    .authorId(deleted ? null : comment.getAuthor().getId())
                    .authorNickname(deleted ? null : comment.getAuthor().getNickname())
                    .authorProfileImage(deleted ? null : comment.getAuthor().getProfileImageUrl())
                    .content(deleted ? "삭제된 댓글입니다." : comment.getContent())
                    .deleted(deleted)
                    .likeCount(comment.getLikeCount())
                    .parentId(comment.getParent() != null ? comment.getParent().getId() : null)
                    .replies(replies)
                    .createdAt(comment.getCreatedAt())
                    .build();
        }
    }
}
