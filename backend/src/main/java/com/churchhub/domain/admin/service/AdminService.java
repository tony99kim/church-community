package com.churchhub.domain.admin.service;

import com.churchhub.domain.admin.dto.AdminDto;
import com.churchhub.domain.auth.repository.RefreshTokenRepository;
import com.churchhub.domain.board.entity.PostStatus;
import com.churchhub.domain.board.repository.PostRepository;
import com.churchhub.domain.church.entity.Church;
import com.churchhub.domain.faith.repository.FaithQuestionRepository;
import com.churchhub.domain.item.repository.ItemRentalRepository;
import com.churchhub.domain.report.entity.ReportStatus;
import com.churchhub.domain.report.repository.ReportRepository;
import com.churchhub.domain.space.entity.RentalStatus;
import com.churchhub.domain.space.repository.SpaceRentalRepository;
import com.churchhub.domain.welcome.repository.WelcomeKitRepository;
import com.churchhub.domain.church.repository.ChurchRepository;
import com.churchhub.domain.user.dto.UserDto;
import com.churchhub.domain.user.entity.User;
import com.churchhub.domain.user.entity.UserRole;
import com.churchhub.domain.user.entity.UserStatus;
import com.churchhub.domain.user.repository.UserRepository;
import com.churchhub.exception.BusinessException;
import com.churchhub.exception.ErrorCode;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final ChurchRepository churchRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final SpaceRentalRepository spaceRentalRepository;
    private final ItemRentalRepository itemRentalRepository;
    private final WelcomeKitRepository welcomeKitRepository;
    private final FaithQuestionRepository faithQuestionRepository;
    private final ReportRepository reportRepository;

    public AdminDto.DashboardResponse getDashboard() {
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        return AdminDto.DashboardResponse.builder()
                .totalUsers(userRepository.count())
                .totalPosts(postRepository.countByStatus(PostStatus.ACTIVE))
                .newUsersToday(userRepository.countByCreatedAtAfter(startOfToday))
                .newPostsToday(postRepository.countByStatusAndCreatedAtAfter(PostStatus.ACTIVE, startOfToday))
                .build();
    }

    // 각 관리 화면의 목록 범위와 동일하게 계산 (교회 담당자는 자기 교회 대여만, 신앙 Q&A는 목회자만)
    public AdminDto.PendingCountsResponse getPendingCounts(Long callerId) {
        User caller = userRepository.findById(callerId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        long spaceRentals;
        long itemRentals;
        if (caller.getRole() == UserRole.CHURCH_MANAGER) {
            Long churchId = caller.getChurch() != null ? caller.getChurch().getId() : null;
            spaceRentals = churchId == null ? 0 : spaceRentalRepository.countBySpace_ChurchIdAndStatus(churchId, RentalStatus.PENDING);
            itemRentals = churchId == null ? 0 : itemRentalRepository.countByItem_ChurchIdAndStatus(churchId, RentalStatus.PENDING);
        } else {
            spaceRentals = spaceRentalRepository.countByStatus(RentalStatus.PENDING);
            itemRentals = itemRentalRepository.countByStatus(RentalStatus.PENDING);
        }
        return AdminDto.PendingCountsResponse.builder()
                .spaceRentals(spaceRentals)
                .itemRentals(itemRentals)
                .welcomeKits(welcomeKitRepository.countByProcessedFalse())
                .faithQuestions(caller.getRole().isFaithMinistry() ? faithQuestionRepository.countUnanswered() : 0)
                .reports(reportRepository.countByStatus(ReportStatus.PENDING))
                .build();
    }

    public Page<UserDto.Response> getUsers(Pageable pageable, String keyword, UserRole role, Long churchId) {
        String kw = (keyword != null && !keyword.isBlank()) ? keyword.trim().toLowerCase() : null;
        Specification<User> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.notEqual(root.get("status"), UserStatus.DELETED));
            if (role != null) predicates.add(cb.equal(root.get("role"), role));
            if (churchId != null) predicates.add(cb.equal(root.get("church").get("id"), churchId));
            if (kw != null) predicates.add(cb.or(
                cb.like(cb.lower(root.get("nickname")), "%" + kw + "%"),
                cb.like(cb.lower(root.get("email")), "%" + kw + "%")
            ));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return userRepository.findAll(spec, pageable).map(UserDto.Response::from);
    }

    @Transactional
    public UserDto.Response updateUserStatus(Long userId, AdminDto.UpdateUserStatusRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        user.changeStatus(request.getStatus());
        if (request.getStatus() != UserStatus.ACTIVE) {
            refreshTokenRepository.deleteAllByUserId(userId);
        }
        return UserDto.Response.from(user);
    }

    @Transactional
    public UserDto.Response updateUserRole(Long userId, AdminDto.UpdateUserRoleRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        user.changeRole(request.getRole());
        boolean needsChurch = request.getRole().isAdmin() && request.getRole() != UserRole.SUPER_ADMIN;
        if (needsChurch) {
            if (request.getChurchId() == null) {
                throw new BusinessException(ErrorCode.CHURCH_NOT_FOUND);
            }
            Church church = churchRepository.findById(request.getChurchId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.CHURCH_NOT_FOUND));
            user.assignChurch(church);
        } else {
            user.assignChurch(null);
        }
        return UserDto.Response.from(user);
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        user.anonymize();
        refreshTokenRepository.deleteAllByUserId(userId);
    }

    @Transactional
    public void updatePostStatus(Long postId, String status) {
        var post = postRepository.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
        post.changeStatus(PostStatus.valueOf(status));
    }
}
