package com.java.web_travel.model.response;

import lombok.Data;
import java.time.LocalDate;

@Data
public class HolidayPolicyResponse {
    private Long id;
    private String name;              // Tên chính sách
    private LocalDate startDate;      // Ngày bắt đầu
    private LocalDate endDate;        // Ngày kết thúc
    private Double increasePercentage;// % tăng/giảm
    private String groupName;         // Tên tập đoàn hoặc tên khách sạn
}