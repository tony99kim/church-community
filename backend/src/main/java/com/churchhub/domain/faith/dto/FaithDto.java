package com.churchhub.domain.faith.dto;

import com.churchhub.domain.faith.entity.FaithAnswer;
import com.churchhub.domain.faith.entity.FaithQuestion;
import com.churchhub.domain.faith.entity.PrayerRequest;
import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

public class FaithDto {

    @Getter
    public static class QuestionRequest {
        @NotBlank private String content;
        private boolean anonymous = false;
        private boolean publicVisible = true;
    }

    @Getter
    public static class AnswerRequest {
        @NotBlank private String content;
    }

    @Getter
    @Builder
    public static class AnswerResponse {
        private Long id;
        private String pastorNickname;
        private String content;
        private LocalDateTime createdAt;

        public static AnswerResponse from(FaithAnswer a) {
            return AnswerResponse.builder()
                    .id(a.getId())
                    .pastorNickname(a.getPastor().getNickname())
                    .content(a.getContent())
                    .createdAt(a.getCreatedAt()).build();
        }
    }

    @Getter
    @Builder
    public static class QuestionResponse {
        private Long id;
        private String authorNickname;  // null if anonymous
        private boolean anonymous;
        private String content;
        private boolean publicVisible;
        private List<AnswerResponse> answers;
        private LocalDateTime createdAt;

        public static QuestionResponse from(FaithQuestion q, List<FaithAnswer> answers) {
            return QuestionResponse.builder()
                    .id(q.getId())
                    .authorNickname(q.isAnonymous() ? null : q.getAuthor().getNickname())
                    .anonymous(q.isAnonymous())
                    .content(q.getContent())
                    .publicVisible(q.isPublicVisible())
                    .answers(answers.stream().map(AnswerResponse::from).toList())
                    .createdAt(q.getCreatedAt()).build();
        }
    }

    @Getter
    public static class PrayerRequestForm {
        @NotBlank private String content;
        private boolean publicVisible = true;
    }

    @Getter
    @Builder
    public static class PrayerResponse {
        private Long id;
        private String authorNickname;
        private String content;
        private boolean publicVisible;
        private int prayerCount;
        private LocalDateTime createdAt;

        public static PrayerResponse from(PrayerRequest p) {
            return PrayerResponse.builder()
                    .id(p.getId())
                    .authorNickname(p.getAuthor().getNickname())
                    .content(p.getContent())
                    .publicVisible(p.isPublicVisible())
                    .prayerCount(p.getPrayerCount())
                    .createdAt(p.getCreatedAt()).build();
        }
    }
}
