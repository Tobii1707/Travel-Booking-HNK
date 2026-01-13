package com.java.web_travel.enums;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

public enum ErrorCode {

    USER_EXISTS(1001,"Người dùng đã tồn tại", HttpStatus.BAD_REQUEST),
    PASSWORD_MISMATCH(1002,"Mật khẩu không khớp", HttpStatus.BAD_REQUEST),
    EMAIL_NOT_VALID(1003,"Email không hợp lệ", HttpStatus.BAD_REQUEST),
    ARGUMENT_NOT_VALID(1004,"Dữ liệu không được để trống hoặc null", HttpStatus.BAD_REQUEST),
    PHONE_NOT_EXISTS(1005,"Số điện thoại không tồn tại", HttpStatus.BAD_REQUEST),
    USER_NOT_EXISTS(1006,"Người dùng không tồn tại", HttpStatus.BAD_REQUEST),
    WRONG_PASSWORD(1007,"Mật khẩu không đúng", HttpStatus.BAD_REQUEST),
    DATE_TIME_NOT_VALID(1008,"Ngày nhận phòng phải trước ngày trả phòng", HttpStatus.BAD_REQUEST),
    DATE_NOT_VALID(1009,"Ngày nhận phòng phải sau thời điểm hiện tại", HttpStatus.BAD_REQUEST),
    NUMBER_NOT_VALID(1010,"Giá trị số không hợp lệ", HttpStatus.BAD_REQUEST),
    ROLE_NOT_FOUND(1011,"Không tìm thấy vai trò", HttpStatus.BAD_REQUEST),
    HOTEL_NOT_FOUND(1012,"Không tìm thấy khách sạn", HttpStatus.BAD_REQUEST),
    ORDER_NOT_FOUND(1013,"Không tìm thấy đơn hàng", HttpStatus.BAD_REQUEST),
    ACCOUNT_NOT_ACTIVE(1014,"Tài khoản chưa được kích hoạt", HttpStatus.BAD_REQUEST),
    NOT_EXISTS(1015,"Đối tượng không tồn tại", HttpStatus.BAD_REQUEST),
    NOT_VALID_FLIGHT_DATE(1016,"Ngày bay không phù hợp với lịch tour", HttpStatus.BAD_REQUEST),
    DATE_INVALID(1017,"Ngày check-in khách sạn phải sau ngày đi", HttpStatus.BAD_REQUEST),
    NUMBER_CHAIR_NOT_VALID(1018,"Không thể thay đổi số ghế ít hơn số ghế đã được đặt", HttpStatus.BAD_REQUEST),
    PRICE_NOT_VALID(1019,"Giá không hợp lệ", HttpStatus.BAD_REQUEST),
    LENGTH_PASS_NOT_VALID(1020,"Độ dài mật khẩu phải lớn hơn hoặc bằng 6 ký tự", HttpStatus.BAD_REQUEST),
    LENGTH_PHONE_NOT_VALID(1021,"Độ dài số điện thoại phải lớn hơn hoặc bằng 10 ký tự", HttpStatus.BAD_REQUEST),
    NUMBER_FLOOR_NOT_VALID(1022,"Số tầng không hợp lệ", HttpStatus.BAD_REQUEST),
    HOTEL_BEDROOM_NOT_AVAILABLE(1023,"Phòng đã có người đặt trước. Vui lòng chọn phòng khác!", HttpStatus.BAD_REQUEST),
    NOT_CHANGE_STATUS_ADMIN(1024,"Không thể thay đổi trạng thái của tài khoản admin", HttpStatus.BAD_REQUEST),
    PAYMENT_PAID_NOT_EXISTS(1025,"Không tìm thấy giao dịch đã thanh toán", HttpStatus.BAD_REQUEST),
    PAYMENT_VERIFY_NOT_EXISTS(1026,"Không tìm thấy giao dịch đang xác minh", HttpStatus.BAD_REQUEST),
    PAYMENT_UNPAID_NOT_EXISTS(1027,"Không tìm thấy giao dịch chưa thanh toán", HttpStatus.BAD_REQUEST),
    PAYMENT_FALSE_NOT_EXISTS(1028,"Không tìm thấy giao dịch thất bại", HttpStatus.BAD_REQUEST),
    EMAIL_TO_NOT_BLANK(1029,"Email người nhận không được để trống", HttpStatus.BAD_REQUEST),
    SUBJECT_NOT_BLANK(1030,"Tiêu đề email không được để trống", HttpStatus.BAD_REQUEST),
    BODY_NOT_BLANK(1031,"Nội dung email không được để trống", HttpStatus.BAD_REQUEST),
    ADMIN_CANNOT_SEND_MESSAGE(1032, "Quản trị viên không thể gửi tin nhắn", HttpStatus.BAD_REQUEST),
    USER_FULLNAME_REQUIRED(1033, "Tên đầy đủ của người dùng là bắt buộc", HttpStatus.BAD_REQUEST),
    USER_EMAIL_REQUIRED(1034, "Email của người dùng là bắt buộc", HttpStatus.BAD_REQUEST),
    USER_PHONE_REQUIRED(1035, "Số điện thoại của người dùng là bắt buộc", HttpStatus.BAD_REQUEST),
    FLIGHT_OUT_OF_SEATS(1036, "Chuyến bay hiện không còn đủ ghế trống", HttpStatus.BAD_REQUEST),
    USER_INFO_NOT_MATCH(1037, "Thông tin họ tên không trùng khớp với tài khoản", HttpStatus.BAD_REQUEST),
    EMAIL_NOT_MATCH(1038, "Email không trùng khớp với tài khoản", HttpStatus.BAD_REQUEST),
    FLIGHT_NOT_FOUND(1039, "Không tìm thấy chuyến bay", HttpStatus.BAD_REQUEST),
    EMAIL_NOT_FOUND(1040, "Email không tồn tại trong hệ thống", HttpStatus.NOT_FOUND),
    INVALID_RESET_TOKEN(1041, "Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn", HttpStatus.BAD_REQUEST),
    TOKEN_ALREADY_USED(1042, "Link đặt lại mật khẩu này đã được sử dụng", HttpStatus.BAD_REQUEST)
    ;

    private int code ;
    private String message;
    private HttpStatusCode httpStatusCode;

    // Constructor nhận 3 tham số
    ErrorCode(int code, String message, HttpStatusCode httpStatusCode) {
        this.code = code;
        this.message = message;
        this.httpStatusCode = httpStatusCode;
    }

    public int getCode() {

        return code;
    }

    public void setCode(int code) {

        this.code = code;
    }

    public String getMessage() {

        return message;
    }

    public void setMessage(String message) {

        this.message = message;
    }
    public HttpStatusCode getHttpStatusCode() {

        return httpStatusCode;
    }

    public void setHttpStatusCode(HttpStatusCode httpStatusCode) {

        this.httpStatusCode = httpStatusCode;
    }
}