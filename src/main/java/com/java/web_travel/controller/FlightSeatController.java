package com.java.web_travel.controller;

import com.java.web_travel.entity.FlightSeat;
import com.java.web_travel.model.response.ApiResponse;
import com.java.web_travel.service.FlightSeatService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/flight-seats")
@Slf4j
public class FlightSeatController {

    @Autowired
    private FlightSeatService flightSeatService;

    @PostMapping("/initialize/{flightId}")
    public ResponseEntity<ApiResponse<String>> initializeSeats(
            @PathVariable Long flightId,
            @RequestParam int numberOfSeats) {
        try {
            flightSeatService.initializeSeatsForFlight(flightId, numberOfSeats);
            return ResponseEntity.ok(new ApiResponse<>(1000, "Seats initialized successfully", "Seats created for flight " + flightId));
        } catch (Exception e) {
            log.error("Error initializing seats: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ApiResponse<>(9999, "Error initializing seats: " + e.getMessage(), null));
        }
    }

    @GetMapping("/available/{flightId}")
    public ResponseEntity<ApiResponse<List<FlightSeat>>> getAvailableSeats(@PathVariable Long flightId) {
        List<FlightSeat> availableSeats = flightSeatService.getAvailableSeats(flightId);
        ApiResponse<List<FlightSeat>> response = new ApiResponse<>();
        response.setCode(1000);
        response.setData(availableSeats);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/all/{flightId}")
    public ResponseEntity<ApiResponse<List<FlightSeat>>> getAllSeats(@PathVariable Long flightId) {
        List<FlightSeat> allSeats = flightSeatService.getAllSeats(flightId);
        ApiResponse<List<FlightSeat>> response = new ApiResponse<>();
        response.setCode(1000);
        response.setData(allSeats);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/count/{flightId}")
    public ResponseEntity<ApiResponse<Long>> getAvailableSeatCount(@PathVariable Long flightId) {
        long count = flightSeatService.getAvailableSeatCount(flightId);
        ApiResponse<Long> response = new ApiResponse<>();
        response.setCode(1000);
        response.setData(count);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/release/{orderId}")
    public ResponseEntity<ApiResponse<String>> releaseSeats(@PathVariable Long orderId) {
        try {
            flightSeatService.releaseSeats(orderId);
            return ResponseEntity.ok(new ApiResponse<>(1000, "Seats released successfully", null));
        } catch (Exception e) {
            log.error("Error releasing seats: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ApiResponse<>(9999, "Error releasing seats: " + e.getMessage(), null));
        }
    }
}
