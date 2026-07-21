package com.churchhub.domain.auth.service;

import com.churchhub.domain.auth.dto.AuthDto;
import com.churchhub.domain.auth.entity.RefreshToken;
import com.churchhub.domain.auth.repository.RefreshTokenRepository;
import com.churchhub.domain.user.entity.User;
import com.churchhub.domain.user.repository.UserRepository;
import com.churchhub.exception.BusinessException;
import com.churchhub.exception.ErrorCode;
import com.churchhub.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void register(AuthDto.RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
        if (userRepository.existsByNickname(request.getNickname())) {
            throw new BusinessException(ErrorCode.NICKNAME_ALREADY_EXISTS);
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .nickname(request.getNickname())
                .phone(request.getPhone())
                .build();

        userRepository.save(user);
    }

    @Transactional
    public AuthDto.TokenResponse login(AuthDto.LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_CREDENTIALS));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }
        if (!user.isActive()) {
            throw new BusinessException(ErrorCode.ACCOUNT_SUSPENDED);
        }

        String accessToken = jwtTokenProvider.createAccessToken(user.getId(), user.getRole().name());
        String refreshToken = jwtTokenProvider.createRefreshToken(user.getId());

        long refreshExpiry = jwtTokenProvider.getRefreshExpiry() / 1000;
        refreshTokenRepository.save(new RefreshToken(refreshToken, user.getId(), refreshExpiry));

        return AuthDto.TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getAccessExpiry() / 1000)
                .build();
    }

    @Transactional
    public void logout(Long userId) {
        refreshTokenRepository.deleteAllByUserId(userId);
    }

    @Transactional
    public AuthDto.TokenResponse refresh(String refreshTokenValue) {
        if (!jwtTokenProvider.validateToken(refreshTokenValue)) {
            throw new BusinessException(ErrorCode.INVALID_TOKEN);
        }

        RefreshToken savedToken = refreshTokenRepository.findById(refreshTokenValue)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_TOKEN));

        Long userId = savedToken.getUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        refreshTokenRepository.delete(savedToken);

        String newAccessToken = jwtTokenProvider.createAccessToken(userId, user.getRole().name());
        String newRefreshToken = jwtTokenProvider.createRefreshToken(userId);

        long refreshExpiry = jwtTokenProvider.getRefreshExpiry() / 1000;
        refreshTokenRepository.save(new RefreshToken(newRefreshToken, userId, refreshExpiry));

        return AuthDto.TokenResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .expiresIn(refreshExpiry)
                .build();
    }

    public boolean checkEmail(String email) {
        return !userRepository.existsByEmail(email);
    }

    public boolean checkNickname(String nickname) {
        return !userRepository.existsByNickname(nickname);
    }
}
