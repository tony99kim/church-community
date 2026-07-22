package com.churchhub.domain.user.repository;

import com.churchhub.domain.user.entity.User;
import com.churchhub.domain.user.entity.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByNickname(String nickname);
    long countByCreatedAtAfter(LocalDateTime dateTime);
    Page<User> findAllByStatusNot(UserStatus status, Pageable pageable);
}
