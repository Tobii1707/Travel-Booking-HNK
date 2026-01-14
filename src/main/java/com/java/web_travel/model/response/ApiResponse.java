package com.java.web_travel.model.response;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * @JsonInclude(JsonInclude.Include.NON_NULL):
 * Annotation này bảo với thư viện Jackson (thư viện chuyển Java -> JSON) rằng:
 * "Nếu trường nào có giá trị là NULL, thì ĐỪNG đưa nó vào kết quả JSON trả về".
 *
 * Ví dụ: Nếu 'data' là null.
 * - Không có dòng này: Trả về { "code": 1000, "message": "Success", "data": null } -> Nhìn rác code.
 * - Có dòng này: Trả về { "code": 1000, "message": "Success" } -> Gọn đẹp.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
/**
 * <T>: Đây là Generic (Kiểu dữ liệu chung).
 * Chữ 'T' là đại diện cho "Bất kỳ kiểu dữ liệu nào".
 * Vì 'data' có thể là Flight, User, hoặc List<Flight>... nên ta để là T để tái sử dụng class này cho mọi nơi.
 */
public class ApiResponse<T> {

    // Mã code quy định riêng của dự án (khác với HTTP Status 200, 404, 500...).
    // Ví dụ: 1000 là Thành công, 1001 là Lỗi validation, 9999 là Lỗi server...
    // Mặc định gán là 1000 (Thành công).
    private int code = 1000;

    // Thông điệp gửi kèm (Ví dụ: "Tạo mới thành công", "Mật khẩu sai").
    private String message;

    // Dữ liệu chính cần trả về. Kiểu T (linh hoạt).
    private T data;

    // Constructor rỗng (Bắt buộc phải có để các thư viện JSON hoạt động)
    public ApiResponse() {}

    // Constructor dùng khi chỉ muốn trả về thông báo lỗi (không có data)
    public ApiResponse(int code, String message) {
        this.code = code;
        this.message = message;
    }

    // Constructor đầy đủ
    public ApiResponse(int code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    // --- Các hàm Getter và Setter (Để lấy và gán dữ liệu) ---

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

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }
}