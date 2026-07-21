package com.churchhub.domain.board.dto;

import com.churchhub.domain.board.entity.Post;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

public class PostDto {

    @Getter
    public static class CreateRequest {
        @NotNull(message = "카테고리를 선택해주세요.")
        private Long categoryId;

        @NotBlank(message = "제목을 입력해주세요.")
        @Size(max = 200, message = "제목은 200자 이내여야 합니다.")
        private String title;

        @NotBlank(message = "내용을 입력해주세요.")
        private String content;

        private String thumbnailUrl;
    }

    @Getter
    public static class UpdateRequest {
        @Size(max = 200, message = "제목은 200자 이내여야 합니다.")
        private String title;
        private String content;
        private String thumbnailUrl;
        private Long categoryId;
    }

    @Getter
    @Builder
    public static class Response {
        private Long id;
        private Long authorId;
        private String authorNickname;
        private String authorProfileImage;
        private Long categoryId;
        private String categoryName;
        private String title;
        private String content;
        private String thumbnailUrl;
        private int viewCount;
        private int likeCount;
        private int commentCount;
        private boolean notice;
        private boolean liked;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public static Response from(Post post, boolean liked) {
            return Response.builder()
                    .id(post.getId())
                    .authorId(post.getAuthor().getId())
                    .authorNickname(post.getAuthor().getNickname())
                    .authorProfileImage(post.getAuthor().getProfileImageUrl())
                    .categoryId(post.getCategory().getId())
                    .categoryName(post.getCategory().getName())
                    .title(post.getTitle())
                    .content(post.getContent())
                    .thumbnailUrl(post.getThumbnailUrl())
                    .viewCount(post.getViewCount())
                    .likeCount(post.getLikeCount())
                    .commentCount(post.getCommentCount())
                    .notice(post.isNotice())
                    .liked(liked)
                    .createdAt(post.getCreatedAt())
                    .updatedAt(post.getUpdatedAt())
                    .build();
        }
    }

    @Getter
    @Builder
    public static class Summary {
        private Long id;
        private String authorNickname;
        private String categoryName;
        private String title;
        private String thumbnailUrl;
        private int viewCount;
        private int likeCount;
        private int commentCount;
        private boolean notice;
        private LocalDateTime createdAt;

        public static Summary from(Post post) {
            return Summary.builder()
                    .id(post.getId())
                    .authorNickname(post.getAuthor().getNickname())
                    .categoryName(post.getCategory().getName())
                    .title(post.getTitle())
                    .thumbnailUrl(post.getThumbnailUrl())
                    .viewCount(post.getViewCount())
                    .likeCount(post.getLikeCount())
                    .commentCount(post.getCommentCount())
                    .notice(post.isNotice())
                    .createdAt(post.getCreatedAt())
                    .build();
        }
    }
}
