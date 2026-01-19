package com.java.web_travel.model.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HotelResponse {
    private Long id; // Response cần ID để FE gắn vào nút Edit/Delete
    private String hotelName;
    private Double hotelPriceFrom;
    private String address;
    private Integer numberFloor;
    private Integer numberRoomPerFloor;
    // Không chứa List<Room> nếu không cần thiết -> Tránh query thừa
}