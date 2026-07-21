package com.churchhub.domain.report.dto;

import com.churchhub.domain.report.entity.Report;
import com.churchhub.domain.report.entity.ReportStatus;
import com.churchhub.domain.report.entity.ReportType;
import lombok.Getter;

import java.time.LocalDateTime;

public class ReportDto {

    @Getter
    public static class CreateRequest {
        private ReportType type;
        private Long targetId;
        private String reason;
    }

    @Getter
    public static class HandleRequest {
        private String adminNote;
    }

    @Getter
    public static class Response {
        private final Long id;
        private final String reporterNickname;
        private final ReportType type;
        private final Long targetId;
        private final String reason;
        private final ReportStatus status;
        private final String adminNote;
        private final LocalDateTime createdAt;

        private Response(Report r) {
            this.id = r.getId();
            this.reporterNickname = r.getReporter().getNickname();
            this.type = r.getType();
            this.targetId = r.getTargetId();
            this.reason = r.getReason();
            this.status = r.getStatus();
            this.adminNote = r.getAdminNote();
            this.createdAt = r.getCreatedAt();
        }

        public static Response from(Report r) {
            return new Response(r);
        }
    }
}
