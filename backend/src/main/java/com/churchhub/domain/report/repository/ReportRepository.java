package com.churchhub.domain.report.repository;

import com.churchhub.domain.report.entity.Report;
import com.churchhub.domain.report.entity.ReportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository extends JpaRepository<Report, Long> {

    Page<Report> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Report> findAllByStatusOrderByCreatedAtDesc(ReportStatus status, Pageable pageable);

    long countByStatus(ReportStatus status);
}
