package com.churchhub.domain.report.service;

import com.churchhub.domain.report.dto.ReportDto;
import com.churchhub.domain.report.entity.Report;
import com.churchhub.domain.report.entity.ReportStatus;
import com.churchhub.domain.report.repository.ReportRepository;
import com.churchhub.domain.user.entity.User;
import com.churchhub.domain.user.repository.UserRepository;
import com.churchhub.exception.BusinessException;
import com.churchhub.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;

    @Transactional
    public void createReport(ReportDto.CreateRequest request, Long reporterId) {
        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        reportRepository.save(Report.builder()
                .reporter(reporter)
                .type(request.getType())
                .targetId(request.getTargetId())
                .reason(request.getReason())
                .build());
    }

    public Page<ReportDto.Response> getReports(ReportStatus status, Pageable pageable) {
        Page<Report> reports = status != null
                ? reportRepository.findAllByStatusOrderByCreatedAtDesc(status, pageable)
                : reportRepository.findAllByOrderByCreatedAtDesc(pageable);
        return reports.map(ReportDto.Response::from);
    }

    @Transactional
    public void resolve(Long reportId, String adminNote) {
        getReport(reportId).resolve(adminNote);
    }

    @Transactional
    public void reject(Long reportId, String adminNote) {
        getReport(reportId).reject(adminNote);
    }

    private Report getReport(Long id) {
        return reportRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.REPORT_NOT_FOUND));
    }
}
