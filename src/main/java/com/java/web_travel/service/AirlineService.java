package com.java.web_travel.service;

import com.java.web_travel.entity.Airline;
import com.java.web_travel.model.request.AirlineDTO;
import java.util.List;

public interface AirlineService {
    Airline createAirline(AirlineDTO airlineDTO);
    Airline updateAirline(Long id, AirlineDTO airlineDTO);
    void deleteAirline(Long id); // Xóa mềm
    Airline getAirlineById(Long id);
    List<Airline> getAllAirlines(); // Lấy tất cả (trừ xóa mềm)
    List<Airline> getDeletedAirlines();
    Airline restoreAirline(Long id);
}