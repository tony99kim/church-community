package com.churchhub.security.oauth2;

import com.churchhub.domain.user.entity.User;
import com.churchhub.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        String userNameAttributeName = userRequest.getClientRegistration()
                .getProviderDetails().getUserInfoEndpoint().getUserNameAttributeName();

        OAuth2UserInfo userInfo = switch (registrationId) {
            case "google" -> new GoogleOAuth2UserInfo(oAuth2User.getAttributes());
            case "kakao"  -> new KakaoOAuth2UserInfo(oAuth2User.getAttributes());
            default -> throw new OAuth2AuthenticationException("지원하지 않는 소셜 로그인: " + registrationId);
        };

        User user = userRepository.findByProviderAndProviderId(userInfo.getProvider(), userInfo.getProviderId())
                .orElseGet(() -> createOAuthUser(userInfo));

        if (!user.isActive()) {
            throw new OAuth2AuthenticationException("정지된 계정입니다.");
        }

        // Enrich attributes with internal user info for SuccessHandler
        Map<String, Object> enriched = new HashMap<>(oAuth2User.getAttributes());
        enriched.put("_userId", user.getId());
        enriched.put("_role", user.getRole().name());

        return new DefaultOAuth2User(
                Collections.singleton(() -> "ROLE_" + user.getRole().name()),
                enriched,
                userNameAttributeName
        );
    }

    private User createOAuthUser(OAuth2UserInfo info) {
        String nickname = resolveUniqueNickname(info.getNickname(), info.getProviderId());
        User user = User.fromOAuth(info.getEmail(), nickname, info.getProfileImageUrl(),
                info.getProvider(), info.getProviderId());
        return userRepository.save(user);
    }

    private String resolveUniqueNickname(String base, String providerId) {
        String clean = base != null ? base.replaceAll("[^가-힣a-zA-Z0-9_]", "") : "";
        if (clean.isEmpty()) clean = "user";
        if (clean.length() > 16) clean = clean.substring(0, 16);

        if (!userRepository.existsByNickname(clean)) return clean;

        String suffix = providerId.length() >= 4
                ? providerId.substring(providerId.length() - 4)
                : providerId;
        String candidate = clean + "_" + suffix;
        if (candidate.length() > 20) candidate = candidate.substring(0, 20);

        if (userRepository.existsByNickname(candidate)) {
            candidate = clean.substring(0, Math.min(clean.length(), 14))
                    + "_" + (int)(Math.random() * 9000 + 1000);
        }
        return candidate;
    }
}
