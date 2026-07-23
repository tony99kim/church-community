package com.churchhub.domain.faith.repository;

import com.churchhub.domain.faith.entity.PrayerRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PrayerRequestRepository extends JpaRepository<PrayerRequest, Long> {
    List<PrayerRequest> findAllByPublicVisibleTrueOrderByCreatedAtDesc();
}
