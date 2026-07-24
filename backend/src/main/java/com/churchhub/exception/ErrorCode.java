package com.churchhub.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // Auth
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다."),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "유효하지 않은 토큰입니다."),
    EXPIRED_TOKEN(HttpStatus.UNAUTHORIZED, "만료된 토큰입니다."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "접근 권한이 없습니다."),

    // User
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 회원입니다."),
    EMAIL_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다."),
    NICKNAME_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 사용 중인 닉네임입니다."),
    ACCOUNT_SUSPENDED(HttpStatus.FORBIDDEN, "정지된 계정입니다."),
    WRONG_PASSWORD(HttpStatus.BAD_REQUEST, "현재 비밀번호가 올바르지 않습니다."),

    // Post
    POST_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 게시글입니다."),
    POST_ACCESS_DENIED(HttpStatus.FORBIDDEN, "게시글 수정/삭제 권한이 없습니다."),

    // Comment
    COMMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 댓글입니다."),
    COMMENT_ACCESS_DENIED(HttpStatus.FORBIDDEN, "댓글 수정/삭제 권한이 없습니다."),

    // Category
    CATEGORY_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 카테고리입니다."),

    // Notification
    NOTIFICATION_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 알림입니다."),

    // Report
    REPORT_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 신고입니다."),

    // Church
    CHURCH_NOT_FOUND(HttpStatus.NOT_FOUND, "교회를 찾을 수 없습니다."),

    // Item
    ITEM_NOT_FOUND(HttpStatus.NOT_FOUND, "물품을 찾을 수 없습니다."),
    ITEM_RENTAL_NOT_FOUND(HttpStatus.NOT_FOUND, "물품 대여 신청을 찾을 수 없습니다."),
    ITEM_OUT_OF_STOCK(HttpStatus.BAD_REQUEST, "재고가 부족합니다."),
    ITEM_TERMS_NOT_AGREED(HttpStatus.BAD_REQUEST, "약관에 동의해야 합니다."),
    ITEM_HAS_RENTALS(HttpStatus.BAD_REQUEST, "대여 신청이 있는 물품은 삭제할 수 없습니다."),

    // Space
    SPACE_NOT_FOUND(HttpStatus.NOT_FOUND, "공간을 찾을 수 없습니다."),
    SPACE_RENTAL_NOT_FOUND(HttpStatus.NOT_FOUND, "대여 신청을 찾을 수 없습니다."),
    SPACE_NOT_AVAILABLE(HttpStatus.BAD_REQUEST, "현재 대여 불가능한 공간입니다."),
    SPACE_HAS_RENTALS(HttpStatus.BAD_REQUEST, "대여 신청이 있는 공간은 삭제할 수 없습니다."),
    SPACE_SLOT_TAKEN(HttpStatus.CONFLICT, "이미 예약된 시간대입니다."),
    SPACE_RENTAL_ALREADY_APPROVED(HttpStatus.BAD_REQUEST, "승인된 예약은 취소할 수 없습니다."),
    SPACE_RENTAL_NOT_CANCELLABLE(HttpStatus.BAD_REQUEST, "이미 처리된 예약입니다."),

    // Event
    EVENT_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 행사입니다."),
    EVENT_FULL(HttpStatus.CONFLICT, "참여 정원이 초과되었습니다."),
    EVENT_ALREADY_JOINED(HttpStatus.CONFLICT, "이미 참여 신청한 행사입니다."),
    EVENT_NOT_JOINED(HttpStatus.BAD_REQUEST, "참여 신청하지 않은 행사입니다."),

    // Common
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "잘못된 입력값입니다."),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다.");

    private final HttpStatus status;
    private final String message;

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }
}
