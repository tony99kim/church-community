package com.churchhub.domain.board.repository;

import com.churchhub.domain.board.entity.Post;
import com.churchhub.domain.board.entity.PostStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostRepository extends JpaRepository<Post, Long> {

    Page<Post> findAllByStatusAndCategoryId(PostStatus status, Long categoryId, Pageable pageable);

    Page<Post> findAllByStatus(PostStatus status, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.status = :status AND " +
           "(p.title LIKE %:keyword% OR p.content LIKE %:keyword%)")
    Page<Post> searchByKeyword(@Param("status") PostStatus status,
                               @Param("keyword") String keyword,
                               Pageable pageable);

    Page<Post> findAllByAuthorId(Long authorId, Pageable pageable);
}
