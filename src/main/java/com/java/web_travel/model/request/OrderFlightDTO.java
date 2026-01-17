package com.java.web_travel.model.request;

import lombok.Data;
import java.util.List;

@Data
public class OrderFlightDTO {
    private Long flightId;
    private List<String> seatNumbers; // Danh sách ghế: ví dụ ["10A", "10B"]
}