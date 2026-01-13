package com.java.web_travel.service;

import com.java.web_travel.entity.Flight;
import com.java.web_travel.model.request.FlightDTO;

import java.util.List;

public interface FlightService {
    public Flight createFlight(FlightDTO flightDTO);
    public void deleteFlight(Long id);
    public Flight updateFlight(Long id,FlightDTO flightDTO);
    public List<Flight> getAllFlights();
}
