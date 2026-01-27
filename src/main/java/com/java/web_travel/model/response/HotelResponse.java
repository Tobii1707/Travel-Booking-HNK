package com.java.web_travel.model.response;

import com.java.web_travel.entity.HotelBedroom;
import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class HotelResponse {
    private Long id; // Response cần ID để FE gắn vào nút Edit/Delete
    private String hotelName;
    private Double hotelPriceFrom;
    private String address;
    private Integer numberFloor;
    private Integer numberRoomPerFloor;
    private Long hotelGroupId;
    private String groupName;
    private List<HotelBedroom> hotelBedrooms;
}