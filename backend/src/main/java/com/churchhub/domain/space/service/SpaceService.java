package com.churchhub.domain.space.service;

import com.churchhub.domain.church.entity.Church;
import com.churchhub.domain.church.repository.ChurchRepository;
import com.churchhub.domain.notification.entity.NotificationType;
import com.churchhub.domain.notification.entity.RelatedType;
import com.churchhub.domain.notification.service.NotificationService;
import com.churchhub.domain.space.dto.SpaceDto;
import com.churchhub.domain.space.entity.Space;
import com.churchhub.domain.space.entity.SpaceRental;
import com.churchhub.domain.space.repository.SpaceRentalRepository;
import com.churchhub.domain.space.repository.SpaceRepository;
import com.churchhub.domain.user.entity.User;
import com.churchhub.domain.user.repository.UserRepository;
import com.churchhub.exception.BusinessException;
import com.churchhub.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SpaceService {

    private final SpaceRepository spaceRepository;
    private final SpaceRentalRepository spaceRentalRepository;
    private final ChurchRepository churchRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public List<SpaceDto.Response> getSpaces() {
        return spaceRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(SpaceDto.Response::from).toList();
    }

    public List<SpaceDto.Response> getAdminSpaces() {
        return spaceRepository.findAllWithChurchOrderByCreatedAtDesc()
                .stream().map(SpaceDto.Response::from).toList();
    }

    @Transactional
    public SpaceDto.Response updateSpace(Long id, SpaceDto.UpdateRequest req) {
        Space space = spaceRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.SPACE_NOT_FOUND));
        Church church = churchRepository.findById(req.getChurchId())
                .orElseThrow(() -> new BusinessException(ErrorCode.CHURCH_NOT_FOUND));
        space.update(req.getName(), req.getDescription(), req.getUsageTypes(), req.getCapacity(), req.isAvailable());
        space.updateChurch(church);
        return SpaceDto.Response.from(space);
    }

    @Transactional
    public void deleteSpace(Long id) {
        if (!spaceRepository.existsById(id)) throw new BusinessException(ErrorCode.SPACE_NOT_FOUND);
        if (spaceRentalRepository.existsBySpaceId(id)) throw new BusinessException(ErrorCode.SPACE_HAS_RENTALS);
        spaceRepository.deleteById(id);
    }

    public List<SpaceDto.RentalResponse> getAllRentals() {
        return spaceRentalRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(SpaceDto.RentalResponse::from).toList();
    }

    public List<SpaceDto.RentalResponse> getMyRentals(Long userId) {
        return spaceRentalRepository.findAllByApplicantIdOrderByCreatedAtDesc(userId)
                .stream().map(SpaceDto.RentalResponse::from).toList();
    }

    @Transactional
    public SpaceDto.Response createSpace(SpaceDto.CreateRequest req) {
        Church church = churchRepository.findById(req.getChurchId())
                .orElseThrow(() -> new BusinessException(ErrorCode.CHURCH_NOT_FOUND));
        Space space = Space.builder()
                .church(church).name(req.getName()).description(req.getDescription())
                .usageTypes(req.getUsageTypes()).capacity(req.getCapacity()).build();
        return SpaceDto.Response.from(spaceRepository.save(space));
    }

    @Transactional
    public SpaceDto.RentalResponse applyRental(Long spaceId, Long userId, SpaceDto.RentalRequest req) {
        Space space = spaceRepository.findById(spaceId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SPACE_NOT_FOUND));
        if (!space.isAvailable()) throw new BusinessException(ErrorCode.SPACE_NOT_AVAILABLE);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        SpaceRental rental = SpaceRental.builder()
                .space(space).applicant(user)
                .startDateTime(req.getStartDateTime()).endDateTime(req.getEndDateTime())
                .headcount(req.getHeadcount()).purpose(req.getPurpose())
                .contactPhone(req.getContactPhone()).build();
        return SpaceDto.RentalResponse.from(spaceRentalRepository.save(rental));
    }

    @Transactional
    public SpaceDto.RentalResponse approveRental(Long rentalId) {
        SpaceRental rental = spaceRentalRepository.findById(rentalId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SPACE_RENTAL_NOT_FOUND));
        rental.approve();
        notificationService.send(rental.getApplicant().getId(), null, NotificationType.NOTICE,
                "공간 대여 신청이 승인되었습니다: " + rental.getSpace().getName(),
                rentalId, RelatedType.POST);
        return SpaceDto.RentalResponse.from(rental);
    }

    @Transactional
    public SpaceDto.RentalResponse rejectRental(Long rentalId, String reason) {
        SpaceRental rental = spaceRentalRepository.findById(rentalId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SPACE_RENTAL_NOT_FOUND));
        rental.reject(reason);
        notificationService.send(rental.getApplicant().getId(), null, NotificationType.NOTICE,
                "공간 대여 신청이 거절되었습니다: " + rental.getSpace().getName(),
                rentalId, RelatedType.POST);
        return SpaceDto.RentalResponse.from(rental);
    }
}
