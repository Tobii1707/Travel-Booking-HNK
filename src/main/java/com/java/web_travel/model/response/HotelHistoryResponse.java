package com.java.web_travel.model.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class HotelHistoryResponse {
    private Long id;
    private String type;        // "POLICY" (Thời vụ) hoặc "PERMANENT" (Vĩnh viễn)
    private String name;        // Tên chính sách hoặc Mô tả hành động
    private Double percentage;  // Phần trăm thay đổi

    // Dành cho Policy
    private String startDate;
    private String endDate;

    // Dành cho Permanent
    private Double oldPrice;
    private Double newPrice;

    // Ngày thực hiện thao tác (để sắp xếp)
    private LocalDateTime createdAt;
}