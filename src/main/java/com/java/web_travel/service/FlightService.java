package com.java.web_travel.service;

import com.java.web_travel.entity.Flight;
import com.java.web_travel.entity.FlightPriceHistory;
import com.java.web_travel.model.request.FlightDTO;

import java.util.List;

public interface FlightService {

    Flight createFlight(FlightDTO flightDTO);
    void deleteFlight(Long id);
    Flight updateFlight(Long id,FlightDTO flightDTO);
    List<Flight> getAllFlights();
    List<Flight> getSuggestedFlights(String fromLocation, String toLocation);

    // Lấy danh sách chuyến bay đã xóa (Thùng rác)
    List<Flight> getDeletedFlights();

    // Khôi phục chuyến bay đã xóa
    Flight restoreFlight(Long id);

    List<Flight> getUpcomingFlightsForUser();

    List<Flight> createMultipleFlights(Long airlineId, List<FlightDTO> flightDTOs);

    void adjustPriceForSelectedFlights(List<Long> flightIds, double percentage);

    List<Flight> searchFlightsForAdmin(String keyword, String departure, String arrival, Long airlineId);

    List<FlightPriceHistory> getFlightPriceHistory(Long flightId);
}