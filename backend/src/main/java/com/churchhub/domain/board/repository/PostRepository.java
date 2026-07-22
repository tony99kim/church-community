package com.churchhub.domain.board.repository;

import com.churchhub.domain.board.entity.Post;
import com.churchhub.domain.board.entity.PostStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface PostRepository extends JpaRepository<Post, Long> {

    Page<Post> findAllByStatusAndCategoryId(PostStatus status, Long categoryId, Pageable pageable);

    Page<Post> findAllByStatus(PostStatus status, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.status = :status AND " +
           "(p.title LIKE %:keyword% OR p.content LIKE %:keyword%)")
    Page<Post> searchByKeyword(@Param("status") PostStatus status,
                               @Param("keyword") String keyword,
                               Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.status = :status AND p.category.id = :categoryId AND " +
           "(p.title LIKE %:keyword% OR p.content LIKE %:keyword%)")
    Page<Post> searchByKeywordAndCategory(@Param("status") PostStatus status,
                                          @Param("keyword") String keyword,
                                          @Param("categoryId") Long categoryId,
                                          Pageable pageable);

    Page<Post> findAllByAuthorIdAndStatus(Long authorId, PostStatus status, Pageable pageable);

    @Modifying
    @Query("UPDATE Post p SET p.commentCount = GREATEST(0, p.commentCount - :count) WHERE p.id = :postId")
    void decrementCommentCount(@Param("postId") Long postId, @Param("count") int count);

    @Modifying
    @Query("UPDATE Post p SET p.commentCount = p.commentCount + 1 WHERE p.id = :postId")
    void incrementCommentCount(@Param("postId") Long postId);

    long countByStatus(PostStatus status);

    long countByStatusAndCreatedAtAfter(PostStatus status, LocalDateTime dateTime);
}
