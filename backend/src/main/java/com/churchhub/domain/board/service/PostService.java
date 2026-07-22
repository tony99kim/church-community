package com.churchhub.domain.board.service;

import com.churchhub.domain.board.dto.PostDto;
import com.churchhub.domain.board.entity.Post;
import com.churchhub.domain.board.entity.PostLike;
import com.churchhub.domain.board.entity.PostStatus;
import com.churchhub.domain.board.repository.PostLikeRepository;
import com.churchhub.domain.board.repository.PostRepository;
import com.churchhub.domain.category.entity.Category;
import com.churchhub.domain.category.repository.CategoryRepository;
import com.churchhub.domain.notification.entity.NotificationType;
import com.churchhub.domain.notification.entity.RelatedType;
import com.churchhub.domain.notification.service.NotificationService;
import com.churchhub.domain.user.entity.User;
import com.churchhub.domain.user.repository.UserRepository;
import com.churchhub.exception.BusinessException;
import com.churchhub.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostService {

    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public Page<PostDto.Summary> getPosts(Long categoryId, String keyword, Pageable pageable) {
        boolean hasKeyword = keyword != null && !keyword.isBlank();
        Page<Post> posts;
        if (categoryId != null) {
            // 부모 카테고리(자식 없는지 확인)인지 체크 — LOCAL 시/도 클릭 시 자식 글 포함
            boolean isParent = categoryRepository.findById(categoryId)
                    .map(c -> c.getParent() == null && !c.getChildren().isEmpty())
                    .orElse(false);
            if (hasKeyword) {
                posts = isParent
                        ? postRepository.searchByKeywordAndCategoryOrParent(PostStatus.ACTIVE, keyword, categoryId, pageable)
                        : postRepository.searchByKeywordAndCategory(PostStatus.ACTIVE, keyword, categoryId, pageable);
            } else {
                posts = isParent
                        ? postRepository.findAllByStatusAndCategoryIdOrParent(PostStatus.ACTIVE, categoryId, pageable)
                        : postRepository.findAllByStatusAndCategoryId(PostStatus.ACTIVE, categoryId, pageable);
            }
        } else if (hasKeyword) {
            posts = postRepository.searchByKeyword(PostStatus.ACTIVE, keyword, pageable);
        } else {
            posts = postRepository.findAllByStatus(PostStatus.ACTIVE, pageable);
        }
        return posts.map(PostDto.Summary::from);
    }

    @Transactional
    public PostDto.Response getPost(Long postId, Long currentUserId) {
        Post post = getActivePost(postId);
        post.incrementViewCount();

        boolean liked = currentUserId != null && postLikeRepository.existsByPostIdAndUserId(postId, currentUserId);
        return PostDto.Response.from(post, liked);
    }

    @Transactional
    public PostDto.Response createPost(PostDto.CreateRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND));

        if (category.getType() == com.churchhub.domain.category.entity.CategoryType.NOTICE && !user.isAdmin()) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        Post post = Post.builder()
                .author(user)
                .category(category)
                .title(request.getTitle())
                .content(request.getContent())
                .thumbnailUrl(request.getThumbnailUrl())
                .build();

        return PostDto.Response.from(postRepository.save(post), false);
    }

    @Transactional
    public PostDto.Response updatePost(Long postId, PostDto.UpdateRequest request, Long userId) {
        Post post = getActivePost(postId);

        if (!post.isAuthor(userId)) {
            throw new BusinessException(ErrorCode.POST_ACCESS_DENIED);
        }

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND));
            if (category.getType() == com.churchhub.domain.category.entity.CategoryType.NOTICE && !post.getAuthor().isAdmin()) {
                throw new BusinessException(ErrorCode.FORBIDDEN);
            }
        }

        post.update(
                request.getTitle() != null ? request.getTitle() : post.getTitle(),
                request.getContent() != null ? request.getContent() : post.getContent(),
                request.getThumbnailUrl(),
                category
        );

        return PostDto.Response.from(post, postLikeRepository.existsByPostIdAndUserId(postId, userId));
    }

    @Transactional
    public void deletePost(Long postId, Long userId, boolean isAdmin) {
        Post post = getActivePost(postId);

        if (!isAdmin && !post.isAuthor(userId)) {
            throw new BusinessException(ErrorCode.POST_ACCESS_DENIED);
        }

        post.changeStatus(PostStatus.DELETED);
    }

    @Transactional
    public boolean toggleLike(Long postId, Long userId) {
        Post post = getActivePost(postId);
        User user = userRepository.getReferenceById(userId);

        Optional<PostLike> existing = postLikeRepository.findByPostIdAndUserId(postId, userId);
        if (existing.isPresent()) {
            postLikeRepository.delete(existing.get());
            post.decrementLikeCount();
            return false;
        } else {
            postLikeRepository.save(PostLike.builder().post(post).user(user).build());
            post.incrementLikeCount();
            notificationService.send(post.getAuthor().getId(), userId, NotificationType.LIKE,
                    user.getNickname() + "님이 회원님의 게시글에 좋아요를 눌렀습니다.", postId, RelatedType.POST);
            return true;
        }
    }

    public Page<PostDto.Summary> getUserPosts(Long authorId, Pageable pageable) {
        return postRepository.findAllByAuthorIdAndStatus(authorId, PostStatus.ACTIVE, pageable).map(PostDto.Summary::from);
    }

    private Post getActivePost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
        if (post.getStatus() != PostStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.POST_NOT_FOUND);
        }
        return post;
    }
}
