package com.churchhub.security.oauth2;

import com.churchhub.domain.auth.service.OAuthCodeStore;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final OAuthCodeStore oAuthCodeStore;

    @Value("${oauth2.redirect-url}")
    private String redirectUrl;

    // 일회용 코드만 넘기고, 프론트 /auth/callback 이 /api/v1/auth/oauth/exchange 로 교환한다 (OAuthCodeStore 참고)
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        Long userId = (Long) oAuth2User.getAttribute("_userId");

        String code = oAuthCodeStore.create(userId);
        String target = UriComponentsBuilder.fromUriString(redirectUrl)
                .queryParam("code", code)
                .build().toUriString();
        getRedirectStrategy().sendRedirect(request, response, target);
    }
}
