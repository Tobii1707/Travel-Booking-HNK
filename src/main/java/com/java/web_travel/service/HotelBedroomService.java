package com.java.web_travel.service;

import com.java.web_travel.entity.HotelBedroom;
import com.java.web_travel.model.request.HotelBedroomDTO;

import java.time.LocalDate;
import java.util.Date;
import java.util.List;

public interface HotelBedroomService {

    HotelBedroom createRoom(HotelBedroomDTO dto);

    HotelBedroom updateRoom(Long roomId, HotelBedroomDTO dto);

    void deleteRoom(Long roomId);

    List<HotelBedroom> getRoomsByHotel(Long hotelId, LocalDate checkInDate);

    HotelBedroom getRoom(Long roomId);

    List<Long> getBookedRoomIds(Long hotelId, Date startDate, Date endDate);
}
