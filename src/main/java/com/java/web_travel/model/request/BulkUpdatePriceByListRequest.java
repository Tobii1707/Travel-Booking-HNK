package com.java.web_travel.model.request;

import lombok.Data;
import java.util.List;

@Data
public class BulkUpdatePriceByListRequest {
    private List<Long> hotelIds; // Danh sách ID các khách sạn đã tích chọn
    private Double percentage;   // % tăng giảm (VD: 10 hoặc -10)
}