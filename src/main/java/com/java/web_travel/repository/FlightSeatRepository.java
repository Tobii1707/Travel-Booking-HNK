package com.java.web_travel.repository;

import com.java.web_travel.entity.Flight;
import com.java.web_travel.entity.FlightSeat;
import com.java.web_travel.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType; // Quan trọng
import org.springframework.data.jpa.repository.Lock; // Quan trọng

import java.util.List;
import java.util.Optional;

public interface FlightSeatRepository extends JpaRepository<FlightSeat, Long> {

    @Query("SELECT fs FROM FlightSeat fs WHERE fs.flight.id = :flightId ORDER BY fs.seatNumber")
    List<FlightSeat> findAllByFlightId(@Param("flightId") Long flightId);

    @Query("SELECT fs FROM FlightSeat fs WHERE fs.flight.id = :flightId AND fs.isBooked = false ORDER BY fs.seatNumber")
    List<FlightSeat> findAvailableSeatsByFlightId(@Param("flightId") Long flightId);

    @Query("SELECT fs FROM FlightSeat fs WHERE fs.order.id = :orderId")
    List<FlightSeat> findByOrderId(@Param("orderId") Long orderId);

    @Query("SELECT COUNT(fs) FROM FlightSeat fs WHERE fs.flight.id = :flightId AND fs.isBooked = false")
    long countAvailableSeatsByFlightId(@Param("flightId") Long flightId);

    @Query("SELECT fs FROM FlightSeat fs WHERE fs.flight.id = :flightId AND fs.seatNumber = :seatNumber")
    Optional<FlightSeat> findByFlightIdAndSeatNumber(@Param("flightId") Long flightId, @Param("seatNumber") String seatNumber);

    @Query("SELECT fs FROM FlightSeat fs WHERE fs.flight = :flight AND fs.seatNumber IN :seatNumbers AND fs.isBooked = false")
    List<FlightSeat> findAvailableSeats(@Param("flight") Flight flight, @Param("seatNumbers") List<String> seatNumbers);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<FlightSeat> findByFlight_IdAndSeatNumber(Long flightId, String seatNumber);

}
