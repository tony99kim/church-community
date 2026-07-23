package com.churchhub.domain.church.repository;

import com.churchhub.domain.church.entity.Church;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChurchRepository extends JpaRepository<Church, Long> {
    List<Church> findAllByVisibleTrueOrderByNameAsc();
}
