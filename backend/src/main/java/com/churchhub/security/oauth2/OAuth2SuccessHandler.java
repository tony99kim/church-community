package com.churchhub.security.oauth2;

import com.churchhub.domain.auth.entity.RefreshToken;
import com.churchhub.domain.auth.repository.RefreshTokenRepository;
import com.churchhub.security.JwtTokenProvider;
import com.churchhub.util.CookieUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${oauth2.redirect-url}")
    private String redirectUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        Long userId = (Long) oAuth2User.getAttribute("_userId");
        String role  = (String) oAuth2User.getAttribute("_role");

        String accessToken  = jwtTokenProvider.createAccessToken(userId, role);
        String refreshToken = jwtTokenProvider.createRefreshToken(userId);

        long refreshTtlSec = jwtTokenProvider.getRefreshExpiry() / 1000;
        refreshTokenRepository.save(new RefreshToken(refreshToken, userId, refreshTtlSec));

        response.addHeader(HttpHeaders.SET_COOKIE,
                CookieUtil.access(accessToken, jwtTokenProvider.getAccessExpiry() / 1000).toString());
        response.addHeader(HttpHeaders.SET_COOKIE,
                CookieUtil.refresh(refreshToken, refreshTtlSec).toString());

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
