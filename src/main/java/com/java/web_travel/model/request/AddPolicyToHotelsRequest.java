package com.java.web_travel.model.request;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Data // Tự động sinh Getter, Setter, toString...
public class AddPolicyToHotelsRequest {

    // Danh sách ID các khách sạn muốn áp dụng chính sách
    private List<Long> hotelIds;

    // Tên chính sách (VD: "Khuyến mãi hè", "Tăng giá ngày lễ")
    private String policyName;

    // Ngày bắt đầu hiệu lực
    private LocalDate startDate;

    // Ngày kết thúc hiệu lực
    private LocalDate endDate;

    // Phần trăm tăng/giảm (VD: 20 là tăng 20%, -10 là giảm 10%)
    private Integer percentage;
}