package com.java.web_travel.repository;

import com.java.web_travel.entity.Flight;
import com.java.web_travel.entity.FlightPriceHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FlightPriceHistoryRepository extends JpaRepository<FlightPriceHistory, Long> {
    // Lấy lịch sử của 1 chuyến bay, sắp xếp mới nhất lên đầu
    List<FlightPriceHistory> findByFlightOrderByChangedAtDesc(Flight flight);
}