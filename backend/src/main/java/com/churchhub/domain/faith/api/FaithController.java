package com.churchhub.domain.faith.api;

import com.churchhub.common.response.ApiResponse;
import com.churchhub.domain.faith.dto.FaithDto;
import com.churchhub.domain.faith.service.FaithService;
import com.churchhub.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/faith")
@RequiredArgsConstructor
public class FaithController {

    private final FaithService faithService;

    @GetMapping("/questions")
    public ApiResponse<List<FaithDto.QuestionResponse>> getQuestions() {
        return ApiResponse.success(faithService.getPublicQuestions());
    }

    @PostMapping("/questions")
    public ApiResponse<FaithDto.QuestionResponse> createQuestion(
            @Valid @RequestBody FaithDto.QuestionRequest req,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(faithService.createQuestion(userDetails.getUserId(), req));
    }

    @PostMapping("/questions/{id}/answers")
    @PreAuthorize("hasAnyRole('PASTOR', 'SUPER_ADMIN')")
    public ApiResponse<FaithDto.AnswerResponse> createAnswer(
            @PathVariable Long id,
            @Valid @RequestBody FaithDto.AnswerRequest req,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(faithService.createAnswer(id, userDetails.getUserId(), req));
    }

    @GetMapping("/prayers")
    public ApiResponse<List<FaithDto.PrayerResponse>> getPrayers() {
        return ApiResponse.success(faithService.getPublicPrayers());
    }

    @PostMapping("/prayers")
    public ApiResponse<FaithDto.PrayerResponse> createPrayer(
            @Valid @RequestBody FaithDto.PrayerRequestForm req,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(faithService.createPrayer(userDetails.getUserId(), req));
    }

    @PostMapping("/prayers/{id}/pray")
    public ApiResponse<FaithDto.PrayerResponse> pray(
            @PathVariable Long id) {
        return ApiResponse.success(faithService.pray(id));
    }
}
