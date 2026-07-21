package com.churchhub.domain.board.service;

import com.churchhub.domain.board.dto.PostDto;
import com.churchhub.domain.board.entity.Post;
import com.churchhub.domain.board.entity.PostLike;
import com.churchhub.domain.board.entity.PostStatus;
import com.churchhub.domain.board.repository.PostLikeRepository;
import com.churchhub.domain.board.repository.PostRepository;
import com.churchhub.domain.category.entity.Category;
import com.churchhub.domain.category.repository.CategoryRepository;
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

    public Page<PostDto.Summary> getPosts(Long categoryId, String keyword, Pageable pageable) {
        Page<Post> posts;
        if (keyword != null && !keyword.isBlank()) {
            posts = postRepository.searchByKeyword(PostStatus.ACTIVE, keyword, pageable);
        } else if (categoryId != null) {
            posts = postRepository.findAllByStatusAndCategoryId(PostStatus.ACTIVE, categoryId, pageable);
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

        Category category = request.getCategoryId() != null
                ? categoryRepository.findById(request.getCategoryId())
                        .orElseThrow(() -> new BusinessException(ErrorCode.CATEGORY_NOT_FOUND))
                : null;

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
            return true;
        }
    }

    public Page<PostDto.Summary> getUserPosts(Long authorId, Pageable pageable) {
        return postRepository.findAllByAuthorId(authorId, pageable).map(PostDto.Summary::from);
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
