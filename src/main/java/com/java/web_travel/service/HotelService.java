package com.java.web_travel.service;

import com.java.web_travel.entity.Hotel;
import com.java.web_travel.model.request.HotelDTO;

import java.util.List;

public interface HotelService {
    public Hotel createHotel(HotelDTO hotelDTO);
    public Hotel getHotel(Long hotelId);
    public List<Hotel> getAllHotels();
    public Hotel updateHotel(HotelDTO hotelDTO,Long hotelId);
    public void deleteHotel(Long hotelId);
    public List<Hotel> getHotelsByDestination(String destination);
}
