package com.java.web_travel.service;

import com.java.web_travel.entity.Flight;
import com.java.web_travel.model.request.FlightDTO;

import java.util.List;

public interface FlightService {
    // --- CODE CŨ CỦA BẠN (GIỮ NGUYÊN) ---
    public Flight createFlight(FlightDTO flightDTO);
    public void deleteFlight(Long id);
    public Flight updateFlight(Long id,FlightDTO flightDTO);
    public List<Flight> getAllFlights();

    // --- CODE MỚI THÊM VÀO ---
    // Hàm này để Controller gọi xuống, nhờ tìm chuyến bay theo điểm đi và đến
    List<Flight> getSuggestedFlights(String fromLocation, String toLocation);
}