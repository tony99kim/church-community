package com.churchhub.domain.user.repository;

import com.churchhub.domain.user.entity.User;
import com.churchhub.domain.user.entity.UserRole;
import com.churchhub.domain.user.entity.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByNickname(String nickname);
    long countByCreatedAtAfter(LocalDateTime dateTime);
    Page<User> findAllByStatusNot(UserStatus status, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.status != :status AND (LOWER(u.nickname) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<User> searchByKeyword(@Param("keyword") String keyword, @Param("status") UserStatus status, Pageable pageable);

    List<User> findByRoleInAndStatus(List<UserRole> roles, UserStatus status);

    @Query("SELECT u FROM User u WHERE u.status = 'ACTIVE' AND u.id != :excludeId AND LOWER(u.nickname) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<User> searchActiveByNickname(@Param("keyword") String keyword, @Param("excludeId") Long excludeId, Pageable pageable);
}
