package com.java.web_travel.service.impl;

import com.java.web_travel.entity.Flight;
import com.java.web_travel.entity.FlightSeat;
import com.java.web_travel.entity.Order;
import com.java.web_travel.enums.ErrorCode;
import com.java.web_travel.exception.AppException;
import com.java.web_travel.repository.FlightRepository;
import com.java.web_travel.repository.FlightSeatRepository;
import com.java.web_travel.service.FlightSeatService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class FlightSeatServiceImpl implements FlightSeatService {

    @Autowired
    private FlightSeatRepository flightSeatRepository;

    @Autowired
    private FlightRepository flightRepository;

    @Override
    @Transactional
    public void initializeSeatsForFlight(Long flightId, int numberOfSeats) {
        Flight flight = flightRepository.findById(flightId)
                .orElseThrow(() -> new AppException(ErrorCode.FLIGHT_NOT_FOUND));

        List<FlightSeat> existingSeats = flightSeatRepository.findAllByFlightId(flightId);
        if (!existingSeats.isEmpty()) {
            log.warn("Seats already initialized for flight {}", flightId);
            return;
        }

        List<FlightSeat> seats = new ArrayList<>();
        int rowsPerClass = numberOfSeats / 6;
        char[] columns = {'A', 'B', 'C', 'D', 'E', 'F'};

        for (int row = 1; row <= rowsPerClass; row++) {
            for (char column : columns) {
                FlightSeat seat = new FlightSeat();
                seat.setFlight(flight);
                seat.setSeatNumber(row + String.valueOf(column));
                seat.setBooked(false);
                seats.add(seat);
            }
        }

        flightSeatRepository.saveAll(seats);
        log.info("Initialized {} seats for flight {}", seats.size(), flightId);
    }

    @Override
    public List<FlightSeat> getAvailableSeats(Long flightId) {
        return flightSeatRepository.findAvailableSeatsByFlightId(flightId);
    }

    @Override
    public List<FlightSeat> getAllSeats(Long flightId) {
        return flightSeatRepository.findAllByFlightId(flightId);
    }

    @Override
    @Transactional
    public boolean bookSeats(Flight flight, Order order, List<String> seatNumbers) {
        try {
            List<FlightSeat> availableSeats = flightSeatRepository
                    .findAvailableSeats(flight, seatNumbers);

            if (availableSeats.size() != seatNumbers.size()) {
                log.error("Not all requested seats are available. Requested: {}, Available: {}",
                        seatNumbers.size(), availableSeats.size());
                return false;
            }

            for (FlightSeat seat : availableSeats) {
                seat.setBooked(true);
                seat.setOrder(order);
            }

            flightSeatRepository.saveAll(availableSeats);
            log.info("Booked {} seats for order {}", seatNumbers.size(), order.getId());
            return true;

        } catch (Exception e) {
            log.error("Error booking seats: {}", e.getMessage());
            return false;
        }
    }

    @Override
    @Transactional
    public void releaseSeats(Long orderId) {
        List<FlightSeat> bookedSeats = flightSeatRepository.findByOrderId(orderId);
        for (FlightSeat seat : bookedSeats) {
            seat.setBooked(false);
            seat.setOrder(null);
        }
        flightSeatRepository.saveAll(bookedSeats);
        log.info("Released {} seats for cancelled order {}", bookedSeats.size(), orderId);
    }

    @Override
    public long getAvailableSeatCount(Long flightId) {
        return flightSeatRepository.countAvailableSeatsByFlightId(flightId);
    }
}

