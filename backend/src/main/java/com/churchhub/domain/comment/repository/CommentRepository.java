package com.churchhub.domain.comment.repository;

import com.churchhub.domain.comment.entity.Comment;
import com.churchhub.domain.comment.entity.CommentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    @Query("SELECT c FROM Comment c LEFT JOIN FETCH c.author WHERE c.post.id = :postId AND c.parent IS NULL ORDER BY c.createdAt ASC")
    List<Comment> findTopLevelCommentsByPostId(@Param("postId") Long postId);

    @Query("SELECT c FROM Comment c LEFT JOIN FETCH c.author WHERE c.parent.id = :parentId AND c.status = :status ORDER BY c.createdAt ASC")
    List<Comment> findRepliesByParentId(@Param("parentId") Long parentId, @Param("status") CommentStatus status);
}
