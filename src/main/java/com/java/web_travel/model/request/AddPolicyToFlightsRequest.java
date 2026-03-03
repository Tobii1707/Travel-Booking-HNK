package com.java.web_travel.model.request;

import lombok.Data;
import java.time.LocalDate;


@Data
public class AddPolicyToFlightsRequest {

    // Tên của sự kiện (Ví dụ: "Khuyến mãi 30/4", "Tết Nguyên Đán 2024")
    private String policyName;

    // Phần trăm tăng/giảm giá (Ví dụ: 20 là tăng 20%, -15 là giảm 15%)
    private Double percentage;

    // Ngày bắt đầu áp dụng chính sách
    private LocalDate startDate;

    // Ngày kết thúc chính sách
    private LocalDate endDate;
}