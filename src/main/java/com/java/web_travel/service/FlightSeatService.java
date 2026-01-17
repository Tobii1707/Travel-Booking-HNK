package com.java.web_travel.service;

import com.java.web_travel.entity.Flight;
import com.java.web_travel.entity.FlightSeat;
import com.java.web_travel.entity.Order;

import java.util.List;

public interface FlightSeatService {
    void initializeSeatsForFlight(Long flightId, int numberOfSeats);
    List<FlightSeat> getAvailableSeats(Long flightId);
    List<FlightSeat> getAllSeats(Long flightId);
    boolean bookSeats(Flight flight, Order order, List<String> seatNumbers);
    void releaseSeats(Long orderId);
    long getAvailableSeatCount(Long flightId);
}
