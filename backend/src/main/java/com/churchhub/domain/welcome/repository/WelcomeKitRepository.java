package com.churchhub.domain.welcome.repository;

import com.churchhub.domain.welcome.entity.WelcomeKit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WelcomeKitRepository extends JpaRepository<WelcomeKit, Long> {
    List<WelcomeKit> findAllByOrderByCreatedAtDesc();
    List<WelcomeKit> findAllByProcessedFalseOrderByCreatedAtDesc();
}
