package com.churchhub.domain.item.service;

import com.churchhub.domain.church.entity.Church;
import com.churchhub.domain.church.repository.ChurchRepository;
import com.churchhub.domain.item.dto.ItemDto;
import com.churchhub.domain.item.entity.Item;
import com.churchhub.domain.item.entity.ItemRental;
import com.churchhub.domain.item.repository.ItemRentalRepository;
import com.churchhub.domain.item.repository.ItemRepository;
import com.churchhub.domain.notification.entity.NotificationType;
import com.churchhub.domain.notification.entity.RelatedType;
import com.churchhub.domain.notification.service.NotificationService;
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
public class ItemService {

    private final ItemRepository itemRepository;
    private final ItemRentalRepository itemRentalRepository;
    private final ChurchRepository churchRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public List<ItemDto.Response> getItems() {
        return itemRepository.findAllByOrderByCategoryAscNameAsc()
                .stream().map(ItemDto.Response::from).toList();
    }

    public List<ItemDto.Response> getAdminItems() {
        return itemRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(ItemDto.Response::from).toList();
    }

    public List<ItemDto.RentalResponse> getAllRentals() {
        return itemRentalRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(ItemDto.RentalResponse::from).toList();
    }

    public List<ItemDto.RentalResponse> getMyRentals(Long userId) {
        return itemRentalRepository.findAllByApplicantIdOrderByCreatedAtDesc(userId)
                .stream().map(ItemDto.RentalResponse::from).toList();
    }

    @Transactional
    public ItemDto.Response createItem(ItemDto.CreateRequest req) {
        Church church = resolveChurch(req.getChurchId());
        Item item = Item.builder()
                .church(church).name(req.getName()).description(req.getDescription())
                .category(req.getCategory()).totalQuantity(req.getTotalQuantity()).build();
        return ItemDto.Response.from(itemRepository.save(item));
    }

    @Transactional
    public ItemDto.Response updateItem(Long id, ItemDto.UpdateRequest req) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.ITEM_NOT_FOUND));
        Church church = resolveChurch(req.getChurchId());
        item.update(church, req.getName(), req.getDescription(), req.getCategory(), req.getTotalQuantity());
        return ItemDto.Response.from(item);
    }

    @Transactional
    public void deleteItem(Long id) {
        if (!itemRepository.existsById(id)) throw new BusinessException(ErrorCode.ITEM_NOT_FOUND);
        itemRepository.deleteById(id);
    }

    @Transactional
    public ItemDto.RentalResponse applyRental(Long itemId, Long userId, ItemDto.RentalRequest req) {
        if (!req.isTermsAgreed()) throw new BusinessException(ErrorCode.ITEM_TERMS_NOT_AGREED);
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ITEM_NOT_FOUND));
        if (!item.hasStock(req.getQuantity())) throw new BusinessException(ErrorCode.ITEM_OUT_OF_STOCK);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        ItemRental rental = ItemRental.builder()
                .item(item).applicant(user).quantity(req.getQuantity())
                .startDate(req.getStartDate()).endDate(req.getEndDate())
                .contactPhone(req.getContactPhone()).purpose(req.getPurpose())
                .termsAgreed(req.isTermsAgreed()).build();
        return ItemDto.RentalResponse.from(itemRentalRepository.save(rental));
    }

    @Transactional
    public ItemDto.RentalResponse approveRental(Long rentalId) {
        ItemRental rental = itemRentalRepository.findById(rentalId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ITEM_RENTAL_NOT_FOUND));
        rental.approve();
        rental.getItem().decreaseStock(rental.getQuantity());
        notificationService.send(
                rental.getApplicant().getId(), null, NotificationType.NOTICE,
                "물품 대여 신청이 승인되었습니다: " + rental.getItem().getName(),
                rentalId, RelatedType.POST);
        return ItemDto.RentalResponse.from(rental);
    }

    @Transactional
    public ItemDto.RentalResponse rejectRental(Long rentalId, String reason) {
        ItemRental rental = itemRentalRepository.findById(rentalId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ITEM_RENTAL_NOT_FOUND));
        rental.reject(reason);
        notificationService.send(
                rental.getApplicant().getId(), null, NotificationType.NOTICE,
                "물품 대여 신청이 거절되었습니다: " + rental.getItem().getName(),
                rentalId, RelatedType.POST);
        return ItemDto.RentalResponse.from(rental);
    }

    private Church resolveChurch(Long churchId) {
        if (churchId == null) return null;
        return churchRepository.findById(churchId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHURCH_NOT_FOUND));
    }
}
