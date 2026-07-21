package com.churchhub.domain.report.api;

import com.churchhub.common.response.ApiResponse;
import com.churchhub.domain.report.dto.ReportDto;
import com.churchhub.domain.report.service.ReportService;
import com.churchhub.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> createReport(
            @RequestBody ReportDto.CreateRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        reportService.createReport(request, userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
