package com.churchhub.domain.admin.service;

import com.churchhub.domain.admin.dto.AdminDto;
import com.churchhub.domain.board.entity.PostStatus;
import com.churchhub.domain.board.repository.PostRepository;
import com.churchhub.domain.user.dto.UserDto;
import com.churchhub.domain.user.entity.User;
import com.churchhub.domain.user.repository.UserRepository;
import com.churchhub.exception.BusinessException;
import com.churchhub.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;

    public AdminDto.DashboardResponse getDashboard() {
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        return AdminDto.DashboardResponse.builder()
                .totalUsers(userRepository.count())
                .totalPosts(postRepository.countByStatus(PostStatus.ACTIVE))
                .newUsersToday(userRepository.countByCreatedAtAfter(startOfToday))
                .newPostsToday(postRepository.countByStatusAndCreatedAtAfter(PostStatus.ACTIVE, startOfToday))
                .build();
    }

    public Page<UserDto.Response> getUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(UserDto.Response::from);
    }

    @Transactional
    public UserDto.Response updateUserStatus(Long userId, AdminDto.UpdateUserStatusRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        user.changeStatus(request.getStatus());
        return UserDto.Response.from(user);
    }

    @Transactional
    public UserDto.Response updateUserRole(Long userId, AdminDto.UpdateUserRoleRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        user.changeRole(request.getRole());
        return UserDto.Response.from(user);
    }

    @Transactional
    public void updatePostStatus(Long postId, String status) {
        var post = postRepository.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
        post.changeStatus(PostStatus.valueOf(status));
    }
}
