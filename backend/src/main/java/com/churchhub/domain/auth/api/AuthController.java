package com.churchhub.domain.auth.api;

import com.churchhub.common.response.ApiResponse;
import com.churchhub.domain.auth.dto.AuthDto;
import com.churchhub.domain.auth.service.AuthService;
import com.churchhub.exception.BusinessException;
import com.churchhub.exception.ErrorCode;
import com.churchhub.security.CustomUserDetails;
import com.churchhub.security.JwtTokenProvider;
import com.churchhub.util.CookieUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "인증", description = "회원가입/로그인 관련 API")
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtTokenProvider jwtTokenProvider;

    @Operation(summary = "회원가입")
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Void>> register(@Valid @RequestBody AuthDto.RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.status(201).body(ApiResponse.success("회원가입이 완료되었습니다.", null));
    }

    @Operation(summary = "로그인")
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthDto.TokenResponse>> login(
            @Valid @RequestBody AuthDto.LoginRequest request,
            HttpServletResponse response) {
        AuthDto.TokenResponse tokens = authService.login(request);
        setCookies(response, tokens.getAccessToken(), tokens.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.success(tokens));
    }

    @Operation(summary = "로그아웃")
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            HttpServletRequest request,
            HttpServletResponse response) {
        String accessToken = CookieUtil.resolve(request, "access_token");
        authService.logout(userDetails.getUserId(), accessToken);
        response.addHeader(HttpHeaders.SET_COOKIE, CookieUtil.delete("access_token").toString());
        response.addHeader(HttpHeaders.SET_COOKIE, CookieUtil.delete("refresh_token").toString());
        return ResponseEntity.ok(ApiResponse.success("로그아웃되었습니다.", null));
    }

    @Operation(summary = "토큰 재발급")
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<Void>> refresh(
            HttpServletRequest request,
            HttpServletResponse response) {
        String refreshToken = CookieUtil.resolve(request, "refresh_token");
        if (refreshToken == null) throw new BusinessException(ErrorCode.INVALID_TOKEN);
        AuthDto.TokenResponse tokens = authService.refresh(refreshToken);
        setCookies(response, tokens.getAccessToken(), tokens.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @Operation(summary = "이메일 중복 확인")
    @GetMapping("/check-email")
    public ResponseEntity<ApiResponse<Boolean>> checkEmail(@RequestParam String email) {
        return ResponseEntity.ok(ApiResponse.success(authService.checkEmail(email)));
    }

    @Operation(summary = "닉네임 중복 확인")
    @GetMapping("/check-nickname")
    public ResponseEntity<ApiResponse<Boolean>> checkNickname(@RequestParam String nickname) {
        return ResponseEntity.ok(ApiResponse.success(authService.checkNickname(nickname)));
    }

    private void setCookies(HttpServletResponse response, String accessToken, String refreshToken) {
        response.addHeader(HttpHeaders.SET_COOKIE,
                CookieUtil.access(accessToken, jwtTokenProvider.getAccessExpiry() / 1000).toString());
        response.addHeader(HttpHeaders.SET_COOKIE,
                CookieUtil.refresh(refreshToken, jwtTokenProvider.getRefreshExpiry() / 1000).toString());
    }
}
