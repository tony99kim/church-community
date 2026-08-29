package com.churchhub.domain.user.service;

import com.churchhub.domain.user.dto.UserDto;
import com.churchhub.domain.user.entity.User;
import com.churchhub.domain.user.entity.UserRole;
import com.churchhub.domain.user.entity.UserStatus;
import com.churchhub.domain.user.repository.UserRepository;
import com.churchhub.exception.BusinessException;
import com.churchhub.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserDto.Response getMyProfile(Long userId) {
        return UserDto.Response.from(getUser(userId));
    }

    @Transactional
    public UserDto.Response updateMyProfile(Long userId, UserDto.UpdateRequest request) {
        User user = getUser(userId);

        if (request.getNickname() != null && !request.getNickname().equals(user.getNickname())) {
            if (userRepository.existsByNickname(request.getNickname())) {
                throw new BusinessException(ErrorCode.NICKNAME_ALREADY_EXISTS);
            }
        }

        user.updateProfile(request.getNickname(), request.getName(), request.getPhone(), request.getProfileImageUrl());
        return UserDto.Response.from(user);
    }

    @Transactional
    public void changePassword(Long userId, UserDto.ChangePasswordRequest request) {
        User user = getUser(userId);

        if (!"LOCAL".equals(user.getProvider())) {
            throw new BusinessException(ErrorCode.SOCIAL_LOGIN_USER);
        }

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BusinessException(ErrorCode.WRONG_PASSWORD);
        }

        user.changePassword(passwordEncoder.encode(request.getNewPassword()));
    }

    public java.util.List<UserDto.PastorInfo> getPastors() {
        return userRepository.findByRoleInAndStatus(
                        java.util.List.of(UserRole.PASTOR, UserRole.SUPER_ADMIN), UserStatus.ACTIVE)
                .stream().map(UserDto.PastorInfo::from).toList();
    }

    public java.util.List<UserDto.BasicInfo> searchUsers(String keyword, Long callerId) {
        return userRepository.searchActiveByNickname(keyword, callerId,
                        org.springframework.data.domain.PageRequest.of(0, 10))
                .stream().map(UserDto.BasicInfo::from).toList();
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }
}
