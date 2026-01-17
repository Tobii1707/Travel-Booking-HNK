package com.java.web_travel.service;

import com.java.web_travel.entity.HotelBedroom;
import com.java.web_travel.model.request.HotelBedroomDTO;

import java.util.List;

public interface HotelBedroomService {

    HotelBedroom createRoom(HotelBedroomDTO dto);

    HotelBedroom updateRoom(Long roomId, HotelBedroomDTO dto);

    void deleteRoom(Long roomId);

    List<HotelBedroom> getRoomsByHotel(Long hotelId);

    HotelBedroom getRoom(Long roomId);
}
