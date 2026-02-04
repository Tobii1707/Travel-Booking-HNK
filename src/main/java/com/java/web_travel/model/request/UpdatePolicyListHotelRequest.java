package com.java.web_travel.model.request;

import lombok.Data;
import java.time.LocalDate;

@Data
public class UpdatePolicyListHotelRequest {
    private String policyName;  // Tên chính sách (ví dụ sửa lại cho đúng chính tả)
    private Double percentage;  // Phần trăm tăng/giảm (ví dụ sửa từ 50% xuống 10%)
    private LocalDate startDate; // Ngày bắt đầu mới
    private LocalDate endDate;   // Ngày kết thúc mới
}